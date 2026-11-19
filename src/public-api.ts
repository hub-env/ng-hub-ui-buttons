/*
 * Public API Surface of ng-hub-ui-buttons
 */

// Types
export * from './lib/models/button.types';

// Tokens
export * from './lib/tokens/dropdown.token';

// Components
export * from './lib/components/btn/button.component';
/**
 * @deprecated Renamed to `HubButtonComponent`. The component now also matches the
 * `[hubButton]` attribute selector, so it replaces the former `HubBtnDirective`.
 */
export { HubButtonComponent as HubBtnComponent } from './lib/components/btn/button.component';
/**
 * @deprecated Replaced by `HubButtonComponent`, which now matches `[hubButton]` itself
 * (and renders the loading spinner in the attribute form too).
 */
export { HubButtonComponent as HubBtnDirective } from './lib/components/btn/button.component';
export * from './lib/components/fab/fab.component';
export * from './lib/components/speed-dial/speed-dial.component';
export * from './lib/components/speed-dial/speed-dial-item/speed-dial-item.component';
export * from './lib/components/dropdown-panel/dropdown-panel.component';
export * from './lib/components/dropdown-item/dropdown-item.component';
export * from './lib/components/dropdown-divider/dropdown-divider.component';
export * from './lib/components/dropdown-header/dropdown-header.component';
export * from './lib/components/button-bar/button-bar.component';

// Directives
export * from './lib/directives/dropdown.directive';

// Cross-library integrations
export * from './lib/integrations/actions.types';
export * from './lib/integrations/actions-cell.component';
export * from './lib/integrations/actions-adapter';
