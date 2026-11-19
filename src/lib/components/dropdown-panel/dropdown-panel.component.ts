import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { resolveHubAccent } from 'ng-hub-ui-utils';
import { HubSemanticColor } from '../../models/button.types';

/**
 * Styled container for dropdown content.
 * Renders a shadowed panel with an optional semantic color top-border accent.
 * Place hub-dropdown-item, hub-dropdown-divider, and hub-dropdown-header children inside.
 */
@Component({
	selector: 'hub-dropdown-panel',
	standalone: true,
	template: `<ng-content></ng-content>`,
	styleUrl: './dropdown-panel.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		class: 'hub-dropdown-panel hub-glass-surface',
		'[class]': '_hostClass',
		'[style.--hub-dropdown-panel-accent]': '_accent'
	}
})
export class HubDropdownPanelComponent {
	/** Adds a semantic color accent to the panel top border. */
	color = input<HubSemanticColor | 'default'>('default');

	protected get _hostClass(): string {
		return this.color() !== 'default' ? `hub-dropdown-panel-${this.color()}` : '';
	}

	/**
	 * The semantic accent painted on the panel top border through the
	 * `--hub-dropdown-panel-accent` slot. Accepts ANY colour: a bareword (a built-in
	 * semantic name, a host-registered accent or a CSS named colour) resolves to its
	 * `--hub-sys-color-<name>` token with the bareword as the raw fallback, so
	 * unregistered names still paint; a literal (`#hex`, `rgb()`, `oklch()`,
	 * `var(...)`) is passed through unchanged. Returns `null` for the `default`
	 * colour (the border keeps its neutral colour) and for the built-in classes,
	 * which paint their own thicker accent — the slot only takes effect for custom /
	 * literal colours.
	 */
	protected get _accent(): string | null {
		return this.color() === 'default' ? null : resolveHubAccent(this.color());
	}
}
