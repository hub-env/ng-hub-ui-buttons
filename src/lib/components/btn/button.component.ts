import { booleanAttribute, ChangeDetectionStrategy, Component, ElementRef, inject, input } from '@angular/core';
import { resolveHubAccent } from 'ng-hub-ui-utils';
import { HubBtnSize, HubBtnVariant, HubSemanticColor } from '../../models/button.types';

/**
 * Styled button. Applies `hub-btn` CSS classes computed from signal inputs and
 * renders an optional loading spinner around the projected content.
 *
 * Usable in two interchangeable forms from the same class:
 * - As an element: `<hub-button variant="solid" color="primary">Save</hub-button>`.
 * - As an attribute on any host: `<button hubButton>Save</button>` / `<a hubButton href="…">Link</a>`.
 *
 * Prefer the attribute form on a native `<button>` / `<a>` when you need real button
 * semantics (focus, keyboard activation, form submission). The `<hub-button>` **element**
 * form is only a styling host — a component cannot swap its own host tag for a native
 * `<button>` — so it self-advertises `role="button"`, a focusable `tabindex`, and
 * Enter/Space keyboard activation to stay accessible. The `[hubButton]` attribute form on
 * a native `<button>`/`<a>` adds **none** of these bindings (the host is already
 * interactive; a redundant `role`/`tabindex` would be harmful).
 *
 * **Accessibility caveat:** an element-form `<hub-button>` now reports `role="button"`,
 * so it must not be nested inside another interactive element (a `<button>`, `<a>` or any
 * host that is itself a control), which would produce an invalid nested-interactive tree.
 *
 * **Icons:** project whatever you want as content — the button is icon-library
 * agnostic. The icon's position follows the markup order, and the label/icon gap
 * is the `--hub-button-gap` token:
 *
 * ```html
 * <button hubButton><hub-icon name="floppy-disk" /> Save</button>
 * <button hubButton>Next <hub-icon name="arrow-right" /></button>
 * <button hubButton aria-label="Settings"><hub-icon name="gear" /></button>
 * ```
 */
@Component({
	selector: 'hub-button, [hubButton]',
	standalone: true,
	templateUrl: './button.component.html',
	styleUrl: './button.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		class: 'hub-btn',
		'[class]': '_hostClass',
		'[style.--hub-btn-accent]': '_accent',
		'[attr.disabled]': '_disabledAttr',
		'[attr.aria-busy]': '_ariaBusy',
		'[attr.aria-disabled]': '_ariaDisabled',
		'[attr.role]': '_role',
		'[attr.tabindex]': '_tabindex',
		'(keydown)': '_onKeydown($event)'
	}
})
export class HubButtonComponent {
	/**
	 * Whether this instance renders as the `<hub-button>` element (vs `[hubButton]` on a
	 * native host). Read once from the host tag at construction — a static host fact that
	 * is available immediately (unlike input signals, which are not populated in the
	 * constructor). Gates the a11y host bindings so they only apply to the element form.
	 */
	private readonly _isElementForm = inject(ElementRef).nativeElement.tagName === 'HUB-BUTTON';

	/** Visual style of the button. */
	variant = input<HubBtnVariant>('solid');

	/** Semantic color token. */
	color = input<HubSemanticColor>('primary');

	/** Size token. */
	size = input<HubBtnSize>('md');

	/**
	 * When true, shows the spinner and marks the button **busy and disabled**: it
	 * reflects `aria-busy="true"`, becomes non-focusable and inert to pointer and
	 * keyboard, and (like {@link disabled}) reflects the native `disabled` attribute
	 * so an in-flight submit button cannot be triggered twice.
	 */
	loading = input(false, { transform: booleanAttribute });

	/**
	 * Mirrors the native disabled attribute on the host element.
	 *
	 * Transformed, so the bare HTML form works: `<button hubButton disabled>` passes the
	 * empty string an attribute without a value carries, which an untransformed
	 * `input(false)` rejects at compile time — on the very spelling the name promises.
	 */
	disabled = input(false, { transform: booleanAttribute });

	/**
	 * True while the button must not respond to interaction — either explicitly
	 * {@link disabled} or busy {@link loading}. Drives the native `disabled`
	 * reflection, the tab-order removal and the keyboard-activation guard so both
	 * states are inert through a single source of truth.
	 */
	private get _isInert(): boolean {
		return this.disabled() || this.loading();
	}

	/** Computed CSS classes applied to the host element via the `[class]` host binding. */
	protected get _hostClass(): string {
		return [
			`hub-btn-${this.variant()}`,
			// Picks up the glass layer's values (ng-hub-ui-ds) on the appearances that use them.
			this.variant() === 'link' ? '' : 'hub-glass-surface',
			`hub-btn-${this.color()}`,
			`hub-btn-${this.size()}`,
			this.loading() ? 'hub-btn-loading' : '',
			this.disabled() ? 'hub-btn-disabled' : ''
		]
			.filter(Boolean)
			.join(' ');
	}

	/**
	 * The single semantic accent consumed by the stylesheet (`--hub-btn-accent`),
	 * from which every visual role (emphasis / subtle / on) is derived at runtime.
	 *
	 * Accepts ANY colour: a bareword (a built-in semantic name, a host-registered
	 * accent or a CSS named colour) resolves to its `--hub-sys-color-<name>` token
	 * with the bareword itself as the raw fallback, so unregistered names still
	 * paint; a literal (`#hex`, `rgb()`, `oklch()`, `var(...)`) is passed through
	 * unchanged. The built-in `hub-btn-<color>` appearance classes remain in place.
	 */
	protected get _accent(): string | null {
		return resolveHubAccent(this.color());
	}

	/** Reflects the inert state (disabled or loading) as the native `disabled` attribute. */
	protected get _disabledAttr(): true | null {
		return this._isInert ? true : null;
	}

	/** Announces the busy state to assistive tech while loading. */
	protected get _ariaBusy(): 'true' | null {
		return this.loading() ? 'true' : null;
	}

	/**
	 * Conveys the inert state to assistive tech on the element form, whose custom
	 * host tag does not natively expose `disabled`. Bound to nothing for the
	 * attribute form (its native host already exposes the state).
	 */
	protected get _ariaDisabled(): 'true' | null {
		return this._isElementForm && this._isInert ? 'true' : null;
	}

	/**
	 * Advertises `role="button"` for the element form only. The attribute form binds
	 * nothing (its native host already exposes the correct role).
	 */
	protected get _role(): 'button' | null {
		return this._isElementForm ? 'button' : null;
	}

	/**
	 * Makes the element form keyboard-focusable (`0`), or removes it from the tab order
	 * when inert — disabled or loading (`-1`). Bound to nothing for the attribute form.
	 */
	protected get _tabindex(): number | null {
		if (!this._isElementForm) {
			return null;
		}

		return this._isInert ? -1 : 0;
	}

	/**
	 * Emulates native button keyboard activation for the element form: Enter or Space
	 * triggers a click. Space additionally calls `preventDefault()` to stop the page from
	 * scrolling. No-op for the attribute form (the native host already handles keys) and
	 * while inert (disabled or loading).
	 * @param event The originating keyboard event.
	 */
	protected _onKeydown(event: KeyboardEvent): void {
		if (!this._isElementForm || this._isInert) {
			return;
		}

		const isSpace = event.key === ' ' || event.key === 'Spacebar';

		if (event.key === 'Enter' || isSpace) {
			if (isSpace) {
				event.preventDefault();
			}

			(event.currentTarget as HTMLElement).click();
		}
	}
}
