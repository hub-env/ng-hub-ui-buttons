import { compile } from 'sass';
import { contrastRatio, oklchToRgb, rgbToOklch, toHex, toRgb } from 'ng-hub-ui-utils';

/**
 * An outline button's border is the only thing that says where the control is, so WCAG 1.4.11
 * asks it for 3:1 against what it sits on. It was painted with the raw accent, and a raw accent
 * is chosen to be a colour, not to be a boundary: measured against the white page, `warning`
 * came out at 1.63:1 and `info` at 1.96:1. The other six pass on their own and must not move.
 *
 * `light` is the exception and is measured for something else — see `EXEMPT_FROM_MIN_CONTRAST`.
 *
 * What is measured here is the rule the library publishes, not a box in a browser: the compiled
 * stylesheet is read, the border's token chain is resolved as a browser would resolve it, and
 * the resulting colour is put on a contrast meter. jsdom lays nothing out and resolves no
 * relative colour, so measuring the element would measure nothing.
 */

/** The ds light-theme accents `--hub-sys-color-*` resolves to. The derivation is what is under test, not the palette. */
const ACCENTS: Readonly<Record<string, string>> = {
	primary: '#0d6efd',
	secondary: '#6c757d',
	success: '#198754',
	danger: '#dc3545',
	warning: '#ffc107',
	info: '#0dcaf0',
	neutral: '#6c757d',
	light: '#f8f9fa',
	dark: '#212529'
};

/** The surface an outline button sits on: it has no fill of its own, so the page shows through. */
const PAGE = '#ffffff';

/** WCAG 1.4.11 — the contrast a non-text boundary has to reach to be a boundary. */
const MIN_CONTRAST = 3;

/** The ds light theme's emphasis window, which the border window is derived from. */
const LIGHT_THEME = {
	'--hub-sys-emphasis-lightness-min': '0',
	'--hub-sys-emphasis-lightness-max': '0.45'
};

const sheet = compile('projects/buttons/src/lib/components/btn/button.component.scss').css;

/** The body of a rule, by its exact selector. */
function ruleBody(selector: string): string {
	const start = sheet.indexOf(`${selector} {`);
	expect(start).toBeGreaterThan(-1);
	return sheet.slice(start + selector.length + 2, sheet.indexOf('}', start));
}

/**
 * A rule body with its comments taken out.
 *
 * Sass keeps a `/** … *\/` comment in the compiled output, and it lands between the `;` and the
 * declaration after it. Splitting the body on `;` then hands back a chunk whose first line is
 * the comment, and the declaration behind it is never seen — which is how the token driving the
 * whole derivation went missing from this map while every assertion still looked fine.
 */
function withoutComments(body: string): string {
	return body.replace(/\/\*[\s\S]*?\*\//g, '');
}

/** A declaration's value inside a rule body. */
function declared(body: string, property: string): string {
	const match = new RegExp(`(?:^|;)\\s*${property}:\\s*([^;]+)`).exec(body);
	expect(match, `${property} is not declared`).not.toBeNull();
	return match![1].replace(/\s+/g, ' ').trim();
}

/** Every custom property the component declares by default, plus the theme's own. */
const TOKENS: Record<string, string> = { ...LIGHT_THEME };
for (const line of withoutComments(ruleBody(':where(:host)')).split(';')) {
	const match = /^\s*(--[\w-]+):\s*([\s\S]+)$/.exec(line);
	if (match) {
		TOKENS[match[1]] = match[2].replace(/\s+/g, ' ').trim();
	}
}

/**
 * Tokens an individual accent redeclares for itself, by accent name.
 *
 * Reading only `:where(:host)` was a hole this suite had: `light` lowers its own border ceiling,
 * and a resolver blind to that went on computing the shared one. The assertion stayed green over
 * a colour the browser never paints — the failure mode a contrast test exists to prevent.
 */
const VARIANT_TOKENS: Record<string, Record<string, string>> = {};

/** Every custom property declared by any rule carrying `selector`, in source order. */
function declarationsOf(selector: string): Record<string, string> {
	const declarations: Record<string, string> = {};
	for (let at = sheet.indexOf(`${selector} {`); at !== -1; at = sheet.indexOf(`${selector} {`, at + 1)) {
		const body = sheet.slice(at + selector.length + 2, sheet.indexOf('}', at));
		for (const line of withoutComments(body).split(';')) {
			const match = /^\s*(--[\w-]+):\s*([\s\S]+)$/.exec(line);
			if (match) {
				declarations[match[1]] = match[2].replace(/\s+/g, ' ').trim();
			}
		}
	}
	return declarations;
}

for (const variant of Object.keys(ACCENTS)) {
	// The accent's own rules, then the ones it writes for a single appearance, which win —
	// `light` keeps a light ink in `outline` and nowhere else, and a resolver that stopped at
	// the accent rule would report the colour of a button that is not on the page.
	VARIANT_TOKENS[variant] = {
		...declarationsOf(`:host(.hub-btn-${variant})`),
		...declarationsOf(`:host(.hub-btn-outline.hub-btn-${variant})`)
	};
}

/** The accent whose rules are in force while a value is being resolved. */
let overlay: Record<string, string> = {};

/** A custom property's declared value, with the accent's own declaration winning. */
function tokenValue(name: string): string | undefined {
	return overlay[name] ?? TOKENS[name];
}

/** Splits a function's arguments on top-level commas. */
function args(inner: string): string[] {
	const out: string[] = [];
	let depth = 0;
	let current = '';
	for (const char of inner) {
		if (char === '(') depth++;
		if (char === ')') depth--;
		if (char === ',' && depth === 0) {
			out.push(current.trim());
			current = '';
			continue;
		}
		current += char;
	}
	out.push(current.trim());
	return out;
}

/** Splits a relative-colour body on top-level whitespace: `from`, the source, then L C H. */
function parts(inner: string): string[] {
	const out: string[] = [];
	let depth = 0;
	let current = '';
	for (const char of inner) {
		if (char === '(') depth++;
		if (char === ')') depth--;
		if (/\s/.test(char) && depth === 0) {
			if (current) out.push(current);
			current = '';
			continue;
		}
		current += char;
	}
	if (current) out.push(current);
	return out;
}

/** The contents of `name(...)` when `value` is exactly that call. */
function call(value: string, name: string): string | null {
	if (!value.toLowerCase().startsWith(`${name}(`) || !value.endsWith(')')) {
		return null;
	}
	return value.slice(name.length + 1, -1).trim();
}

/**
 * Resolves a value the way a browser would: substituting custom properties, falling back where
 * the cascade has nothing, and evaluating the `min` / `max` / `clamp` a lightness expression is
 * written with. `l` is the source colour's own lightness.
 */
function resolveNumber(value: string, lightness: number): number {
	const trimmed = value.trim();
	if (trimmed === 'l') {
		return lightness;
	}

	const variable = call(trimmed, 'var');
	if (variable) {
		const [name, ...fallback] = args(variable);
		const declaredValue = tokenValue(name);
		return resolveNumber(declaredValue ?? fallback.join(', '), lightness);
	}

	for (const [name, pick] of [
		['min', Math.min],
		['max', Math.max]
	] as const) {
		const inner = call(trimmed, name);
		if (inner) {
			return pick(...args(inner).map((part) => resolveNumber(part, lightness)));
		}
	}

	const clamp = call(trimmed, 'clamp');
	if (clamp) {
		const [low, mid, high] = args(clamp).map((part) => resolveNumber(part, lightness));
		// CSS resolves clamp() as max(low, min(mid, high)), so an inverted window yields `low`.
		return Math.max(low, Math.min(mid, high));
	}

	return Number(trimmed);
}

/** Resolves a colour-valued declaration down to a hex string, for the given accent. */
function resolveColor(value: string, accent: string): string {
	const trimmed = value.trim();

	const variable = call(trimmed, 'var');
	if (variable) {
		const [name, ...fallback] = args(variable);
		if (name === '--hub-btn-accent') {
			return accent;
		}
		const declaredValue = tokenValue(name);
		return resolveColor(declaredValue ?? fallback.join(', '), accent);
	}

	const relative = call(trimmed, 'oklch');
	if (relative?.startsWith('from')) {
		// `oklch(from <color> <l> c h)` — only the lightness is rewritten here, which is the
		// whole point of the derivation: hue and chroma are the accent's and stay untouched.
		const [, source, lightness] = parts(relative);
		const base = rgbToOklch(toRgb(resolveColor(source, accent))!);
		const rewritten = oklchToRgb({ ...base, l: resolveNumber(lightness, base.l) });
		return toHex({
			r: Math.min(255, Math.max(0, rewritten.r)),
			g: Math.min(255, Math.max(0, rewritten.g)),
			b: Math.min(255, Math.max(0, rewritten.b)),
			a: 1
		})!;
	}

	return trimmed;
}

/** The colour the label of an outline button is actually painted with, per variant. */
function labelColor(variant: string): string {
	const value = declared(ruleBody(':host(.hub-btn-outline)'), 'color');
	overlay = VARIANT_TOKENS[variant] ?? {};
	try {
		return resolveColor(value, ACCENTS[variant]);
	} finally {
		overlay = {};
	}
}

/** The colour the border of an outline button is actually painted with, per variant. */
function borderColor(variant: string, state: 'resting' | 'hover'): string {
	const body = ruleBody(':host(.hub-btn-outline)');
	const value = state === 'resting' ? declared(body, 'border-color') : declared(body, '--hub-btn-hover-border');
	overlay = VARIANT_TOKENS[variant] ?? {};
	try {
		return resolveColor(value, ACCENTS[variant]);
	} finally {
		overlay = {};
	}
}

/**
 * `light` is held to a different promise, on purpose.
 *
 * Reaching 3:1 on a white page means becoming a mid grey, and there is already an accent that
 * is a mid grey: `neutral`. Forcing `light` there cost the palette one of its nine — the two
 * were 32 apart in RGB, which reads as the same button. `light` is a surface colour meant for a
 * dark header, so on a light page it keeps a faint edge, nudged down only far enough to show
 * the shape of the control.
 */
const EXEMPT_FROM_MIN_CONTRAST = ['light'];

/** The accents whose border is a boundary on a light page, and must measure like one. */
const BOUNDARY_ACCENTS = Object.keys(ACCENTS).filter((variant) => !EXEMPT_FROM_MIN_CONTRAST.includes(variant));

describe('outline button border contrast', () => {
	it.each(BOUNDARY_ACCENTS)('keeps the %s border at 3:1 against the page', (variant) => {
		const color = borderColor(variant, 'resting');

		expect(contrastRatio(color, PAGE)!).toBeGreaterThanOrEqual(MIN_CONTRAST);
	});

	it.each(BOUNDARY_ACCENTS)('keeps the %s border at 3:1 while hovered', (variant) => {
		const color = borderColor(variant, 'hover');

		expect(contrastRatio(color, PAGE)!).toBeGreaterThanOrEqual(MIN_CONTRAST);
	});

	it('keeps the light border light enough to still be light', () => {
		expect(contrastRatio(borderColor('light', 'resting'), PAGE)!).toBeLessThan(MIN_CONTRAST);
	});

	it('brings the light border far enough down to be seen at all', () => {
		const painted = contrastRatio(borderColor('light', 'resting'), PAGE)!;
		const raw = contrastRatio(ACCENTS['light'], PAGE)!;

		// The raw accent measures 1.05:1 — an edge that is not there. Anything under about 1.5:1
		// is still nothing, so the floor is what separates "faint" from "absent".
		expect(painted).toBeGreaterThan(1.8);
		expect(painted).toBeGreaterThan(raw);
	});

	it('keeps light and neutral telling apart, which is what forcing the minimum destroyed', () => {
		const light = toRgb(borderColor('light', 'resting'))!;
		const neutral = toRgb(borderColor('neutral', 'resting'))!;
		const distance = Math.hypot(light.r - neutral.r, light.g - neutral.g, light.b - neutral.b);

		// Clamped to the shared ceiling the two sat 32 apart, which nobody could tell apart.
		expect(distance).toBeGreaterThan(80);
	});

	/**
	 * An outline button is a label with a line around it, and the two read as one mark. The
	 * border used to be the raw accent while the label was already the emphasis ink, so every
	 * outline button was drawn in two shades of the same colour.
	 */
	it.each(Object.keys(ACCENTS))('draws the %s border and label in the same ink', (variant) => {
		expect(borderColor(variant, 'resting').toLowerCase()).toBe(labelColor(variant).toLowerCase());
	});

	it.each(Object.keys(ACCENTS))('keeps the %s border and label together while hovered', (variant) => {
		// The outline rule does not restate the hover label; it takes the shared slot.
		overlay = VARIANT_TOKENS[variant] ?? {};
		const hoverLabel = resolveColor('var(--hub-btn-hover-color)', ACCENTS[variant]);
		overlay = {};

		expect(borderColor(variant, 'hover').toLowerCase()).toBe(hoverLabel.toLowerCase());
	});

	it('leaves the outline label and the solid fill where they were', () => {
		const outline = ruleBody(':host(.hub-btn-outline)');
		const solid = ruleBody(':host(.hub-btn-solid)');

		expect(declared(outline, 'color')).toBe('var(--hub-btn-accent-emphasis)');
		expect(declared(solid, 'background')).toBe('var(--hub-btn-accent)');
		expect(declared(solid, 'color')).toBe('var(--hub-btn-accent-on)');
	});
});
