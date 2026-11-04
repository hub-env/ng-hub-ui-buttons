import { compile } from 'sass';

/**
 * A medium button stands as tall as a form field, so a select and an "Assign" button share a row
 * without a two-pixel step between them.
 *
 * jsdom lays nothing out, so the height is pinned as the rules the build compiles. The field side of
 * the arithmetic lives in `ng-hub-ui-forms` (`--hub-field-control-min-height`): one line of text,
 * 0.375rem of padding and a 1px border on each side, 38px with the design system's defaults.
 */
const sheet = compile('projects/buttons/src/lib/components/btn/button.component.scss').css;

/** The body of a rule, by its exact selector. */
function ruleBody(selector: string): string {
	const start = sheet.indexOf(`${selector} {`);
	expect(start).toBeGreaterThan(-1);
	return sheet.slice(start + selector.length + 2, sheet.indexOf('}', start));
}

/** The value a rule body gives a property, whitespace collapsed (also inside brackets); `null` when it gives none. */
function declaration(body: string, property: string): string | null {
	const match = body.match(new RegExp(`(?:^|[;{\\s])${property}\\s*:([^;]*);`));
	return match ? match[1].trim().replace(/\s+/g, ' ').replace(/\(\s+/g, '(').replace(/\s+\)/g, ')') : null;
}

describe('hub-button height next to a form field', () => {
	it('floors a medium button at the height a field is built to', () => {
		const tokens = ruleBody(':where(:host)');

		expect(declaration(tokens, '--hub-button-min-height')).toBe(
			'calc(var(--hub-button-line-height) * var(--hub-button-font-size) + 2 * 0.375rem + 2 * var(--hub-ref-border-width, 1px))'
		);
		expect(declaration(ruleBody(':host'), 'min-block-size')).toBe('var(--hub-button-min-height)');
	});

	it('sets its line height instead of inheriting the page one', () => {
		expect(declaration(ruleBody(':where(:host)'), '--hub-button-line-height')).toBe('var(--hub-ref-line-height-base, 1.5)');
		expect(declaration(ruleBody(':host'), 'line-height')).toBe('var(--hub-button-line-height)');
	});

	it('keeps the padding under the floor, so the floor decides the height', () => {
		// 0.25rem each side, a 1.5px border and a 24px line come to 35px: below 38, so a border the
		// screen draws 1px wide cannot leave the button a pixel short of the field.
		expect(declaration(ruleBody(':where(:host)'), '--hub-button-padding-y')).toBe('var(--hub-ref-space-1, 0.25rem)');
	});

	it('lets a small button stay smaller than a field', () => {
		expect(declaration(ruleBody(':host(.hub-btn-sm)'), '--hub-button-min-height')).toBe('0px');
	});
});
