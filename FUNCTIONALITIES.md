# Functionalities of Buttons Library

This table details the functionalities of the `ng-hub-ui-buttons` library and indicates which ones are covered by interactive examples.

The package ships four families: the in-flow button (`hub-button` / `[hubButton]`), the floating action button (`hub-fab`), the speed dial (`hub-speed-dial` and its items) and the overlay dropdown (`[hubDropdown]` with its panel, item, divider and header), plus the cross-library row-actions integration.

## Button (`hub-button` / `[hubButton]`)

| Category          | Functionality                                                                            | Example Covered |
| :---------------- | :--------------------------------------------------------------------------------------- | :-------------: |
| **Host forms**    | Element form (`<hub-button>`)                                                            |       ✅        |
|                   | Attribute form on a native host (`<button hubButton>` / `<a hubButton>`)                 |       ✅        |
| **Variants**      | `solid`                                                                                  |       ✅        |
|                   | `outline`                                                                                |       ✅        |
|                   | `soft`                                                                                   |       ✅        |
|                   | `ghost`                                                                                  |       ✅        |
|                   | `link`                                                                                   |       ✅        |
| **Colour**        | Semantic accent (`color`), from the nine built-ins (`primary` … `dark`)                  |       ✅        |
|                   | Custom accent registered by the consumer (open set)                                      |       ✅        |
|                   | Literal colour (`#hex`, `rgb()`, `oklch()`, CSS named colour)                            |       ❌        |
| **Sizing**        | Size scale (`sm` / `md` / `lg` / `xl`)                                                   |       ❌        |
| **State**         | `loading` — spinner plus `aria-busy`, native `disabled`, out of the tab order            |       ✅        |
|                   | Swappable spinner glyph (`--hub-button-spinner`)                                         |       ✅        |
|                   | `disabled`                                                                               |       ❌        |
|                   | Bare boolean attribute spelling (`<button hubButton disabled>`)                          |       ❌        |
| **Content**       | Projected icon before or after the label (no `icon` input by design)                     |       ❌        |
| **Accessibility** | Element form advertises `role="button"`, focusable `tabindex` and Enter/Space activation |       ❌        |
|                   | Attribute form adds no redundant `role` / `tabindex`                                     |       ❌        |

## Floating Action Button (`hub-fab`)

| Category          | Functionality                                                                                  | Example Covered |
| :---------------- | :--------------------------------------------------------------------------------------------- | :-------------: |
| **Placement**     | Nine-slot fixed viewport grid (`position`)                                                     |       ✅        |
|                   | RTL through `inset-inline-*` / `inset-block-*` logical properties                              |       ❌        |
| **Appearance**    | Size (`mini` / `standard` / `large`)                                                           |       ❌        |
|                   | Semantic accent (`color`)                                                                      |       ❌        |
|                   | Extended pill (`extended`)                                                                     |       ❌        |
|                   | `collapseOnScroll` — collapses past 50px of scroll, expands near the top                       |       ❌        |
|                   | `disabled`                                                                                     |       ❌        |
| **Content**       | `[slot=icon]` projection                                                                       |       ❌        |
|                   | `[slot=label]` projection (extended form only)                                                 |       ❌        |
|                   | Default projection (non-extended form)                                                         |       ✅        |
| **Events**        | `fabClick`                                                                                     |       ❌        |
| **Accessibility** | `role="button"`, `tabindex` (`-1` plus `aria-disabled` while disabled), Enter/Space activation |       ❌        |

## Speed Dial (`hub-speed-dial` / `hub-speed-dial-item`)

| Category        | Functionality                                                             | Example Covered |
| :-------------- | :------------------------------------------------------------------------ | :-------------: |
| **Placement**   | Nine-slot FAB grid (`position`)                                           |       ✅        |
|                 | Expansion direction (`up` / `down` / `left` / `right`)                    |       ❌        |
| **Appearance**  | Trigger size (`mini` / `standard` / `large`)                              |       ❌        |
|                 | Trigger accent (`color`)                                                  |       ✅        |
| **Interaction** | `trigger="click"`                                                         |       ✅        |
|                 | `trigger="hover"`, watched on the host so the pointer can reach the items |       ❌        |
|                 | Two-way `isOpen` model                                                    |       ❌        |
|                 | `open()` / `close()` / `toggle()` methods                                 |       ❌        |
|                 | Escape closes the dial                                                    |       ❌        |
|                 | `opened` / `closed` outputs                                               |       ❌        |
| **Content**     | `[hubTrigger]` trigger slot                                               |       ✅        |
|                 | Action items projected as default content                                 |       ✅        |
| **Items**       | Icon class (`icon`)                                                       |       ✅        |
|                 | Tooltip label (`label`)                                                   |       ✅        |
|                 | Item accent (`color`, `default` keeps the neutral appearance)             |       ❌        |
|                 | `disabled`                                                                |       ❌        |
|                 | `itemClick` output                                                        |       ❌        |
| **SSR**         | Escape listener wired only in the browser                                 |       ❌        |

## Overlay Dropdown (`[hubDropdown]` and helpers)

| Category        | Functionality                                                                                                          | Example Covered |
| :-------------- | :--------------------------------------------------------------------------------------------------------------------- | :-------------: |
| **Attachment**  | Any `<ng-template>` panel on any trigger, through `OverlayService` (no CDK)                                            |       ✅        |
|                 | Eight placements (`placement`)                                                                                         |       ❌        |
|                 | Flips to the opposite edge when the panel does not fit — `bottom` to `top`, and logical `end` to `start`, RTL included |       ❌        |
|                 | `offsetY` gap                                                                                                          |       ❌        |
|                 | `panelClass` on the overlay                                                                                            |       ❌        |
| **Interaction** | `trigger="click"`                                                                                                      |       ✅        |
|                 | `trigger="hover"`, with a grace period so the pointer can cross to the panel                                           |       ❌        |
|                 | `closeOnSelect` (default `true`; `false` keeps the panel open)                                                         |       ❌        |
|                 | `disabled` prevents opening                                                                                            |       ❌        |
|                 | Two-way `isOpen` model                                                                                                 |       ❌        |
|                 | `open()` / `close()` / `toggle()` methods                                                                              |       ✅        |
|                 | Closes on Escape and on a click outside                                                                                |       ❌        |
|                 | Re-anchors an open panel on scroll, on resize and when the trigger moves                                               |       ❌        |
|                 | Only one dropdown open at a time, however it was opened                                                                |       ✅        |
|                 | `opened` / `closed` outputs                                                                                            |       ❌        |
| **Panel**       | `hub-dropdown-panel` container                                                                                         |       ✅        |
|                 | Semantic accent border on the panel (`color`)                                                                          |       ❌        |
| **Item**        | `hub-dropdown-item` with `itemClick`                                                                                   |       ✅        |
|                 | Item accent (`color`)                                                                                                  |       ✅        |
|                 | Icon class (`icon`)                                                                                                    |       ❌        |
|                 | `selected` checkmark                                                                                                   |       ❌        |
|                 | `disabled`                                                                                                             |       ❌        |
| **Grouping**    | `hub-dropdown-header`                                                                                                  |       ✅        |
|                 | `hub-dropdown-divider` (`role="separator"`)                                                                            |       ✅        |

## Cross-library row actions

| Category      | Functionality                                                                | Example Covered |
| :------------ | :--------------------------------------------------------------------------- | :-------------: |
| **Adapter**   | `hubActionsAdapter` draws a host library's row actions with these components |       ❌        |
| **Cell**      | `hub-actions-cell` from a single `config: HubActionsCellConfig`              |       ❌        |
| **Semantics** | A click on an action does not reach the surrounding row                      |       ❌        |

## Styling

| Category          | Functionality                                                                      | Example Covered |
| :---------------- | :--------------------------------------------------------------------------------- | :-------------: |
| **CSS Variables** | Button shell tokens (`--hub-button-*`)                                             |       ✅        |
|                   | Local accent slot and derived role family (`--hub-btn-accent*`)                    |       ✅        |
|                   | Hover / pressed slots (`--hub-btn-hover-*`, `--hub-btn-active-*`)                  |       ❌        |
|                   | FAB tokens (`--hub-fab-*`)                                                         |       ❌        |
|                   | Speed-dial tokens (`--hub-speed-dial-*`)                                           |       ❌        |
|                   | Dropdown tokens (`--hub-dropdown-panel-*`, `--hub-dropdown-item-*`)                |       ❌        |
|                   | `:where()` zero-specificity defaults, so a consumer rule wins without `!important` |       ✅        |
| **SCSS Mixins**   | `hub-btn-theme($accent, $border-radius, $padding-x, $padding-y, $font-size)`       |       ✅        |
|                   | `hub-btn-color-rules($type)`                                                       |       ✅        |
|                   | `hub-btn-variant-rules(...)`                                                       |       ❌        |
|                   | `hub-fab-color($type)`                                                             |       ❌        |
|                   | `hub-dropdown-panel-color($type)` / `hub-dropdown-panel-color-rules($type)`        |       ❌        |
|                   | `hub-dropdown-item-color($type)` / `hub-dropdown-item-color-rules($type)`          |       ❌        |
