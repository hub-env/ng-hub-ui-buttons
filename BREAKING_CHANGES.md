# Breaking Changes

## [22.14.0] - 2026-09-23

### An open dropdown no longer closes on scroll

- **Change**: `[hubDropdown]` used to close its panel on the first scroll anywhere on the page.
  It now keeps the panel open and re-anchors it to the trigger instead, on scroll, on a window
  resize and whenever the trigger moves for any other reason.

- **Why**: closing was the only way to keep the panel glued to its trigger when this was written.
  The overlay can follow an origin now, and closing a menu because something scrolled behind it
  is not what a reader asked for. It also stood in the way of the flip this release adds: a panel
  that must re-decide whether it still fits has to survive the scroll that changed the answer.

- **Impact — an application that relied on the scroll to dismiss the menu has to dismiss it
  itself.** Escape, a click outside and `close()` all still work, and `isOpen` is a two-way model,
  so a consumer that wants the old behaviour closes on its own scroll listener. Nothing else in
  the directive's shape changes: no input, output or method was added, removed or renamed.

## [22.13.0] - 2026-09-23

### Angular below 17.3.0 is no longer supported

- **Change**: the `@angular/*` peer ranges move from `>=17.2.0` to `>=17.3.0`.

- **Why**: Its published `.d.ts` names `InputSignalWithTransform` or `OutputEmitterRef`, which Angular did not ship until 17.3.

- **Impact — an application below 17.3.0 gets a peer warning where it used to get a build error.**
  Nothing that worked stops working: those versions never compiled against this package. Upgrade
  Angular to 17.3.0 or stay on the previous release.

## [22.6.0] - 2026-06-30

### `iconOnly` removed

A button now sizes to its own content, so the `iconOnly` input and the forced square layout it switched on (`:host(.hub-btn-icon)`) are gone.

**Before:**

```html
<hub-button iconOnly><i class="fa-solid fa-pen"></i></hub-button>
```

**After:**

```html
<button hubButton aria-label="Edit"><i class="fa-solid fa-pen"></i></button>
```

**Migration:** drop the input and project only the icon — symmetric padding keeps the button balanced without a dedicated mode. Give it an `aria-label`: the removed mode did not supply an accessible name either, and an icon-only button has no text to fall back on.

---

## [22.4.0] - 2026-06-26

### `z-index` tokens renamed to the canonical `zindex` spelling

| Before                         | After                         |
| ------------------------------ | ----------------------------- |
| `--hub-fab-z-index`            | `--hub-fab-zindex`            |
| `--hub-dropdown-panel-z-index` | `--hub-dropdown-panel-zindex` |
| `--hub-speed-dial-z-index`     | `--hub-speed-dial-zindex`     |

**Migration:** rename the custom property wherever you set it. The names now match the `--hub-sys-zindex-*` convention the rest of the family uses. A stylesheet left on the old spelling sets a variable nothing reads, so the component silently keeps its default stacking order — there is no error to catch it.

---

## [22.2.0] - 2026-06-23

### Selectors renamed

**Before:**

```html
<hub-btn color="primary">Save</hub-btn> <button hubBtn color="primary">Save</button>
```

**After:**

```html
<hub-button color="primary">Save</hub-button> <button hubButton color="primary">Save</button>
```

**Migration:** rename the element and the attribute. The class keeps working under both names — `HubBtnComponent` and `HubBtnDirective` are still exported as deprecated aliases of `HubButtonComponent` — but the template selectors are not aliased, so markup left on `hub-btn` / `[hubBtn]` renders an unknown element or a plain button with no styling and no error.

---

### Button CSS custom properties renamed `--hub-btn-*` → `--hub-button-*`

The button's own tokens took the element's new name: `--hub-btn-padding-x` → `--hub-button-padding-x`, `--hub-btn-font-size` → `--hub-button-font-size`, and so on for the whole set.

**Migration:** rename every override. Nothing warns you: a declaration on the old name is a valid custom property that no rule consumes, so the button quietly keeps its default.

> Note for readers of later versions: the `--hub-btn-*` prefix came back in 22.4.0 and 22.8.0 for a **different** family — the local accent slot (`--hub-btn-accent`, `-emphasis`, `-subtle`, `-on`) and the interaction slots (`--hub-btn-hover-*`, `--hub-btn-active-*`). Those are colour inputs, not the shell tokens renamed here.

---

## [22.1.0] - 2026-06-23

### Speed Dial trigger slot renamed

**Before:**

```html
<hub-speed-dial>
	<hub-btn slot="trigger">+</hub-btn>
	...
</hub-speed-dial>
```

**After:**

```html
<hub-speed-dial>
	<hub-btn hubTrigger>+</hub-btn>
	...
</hub-speed-dial>
```

**Migration:** replace `slot="trigger"` with the `hubTrigger` attribute on the trigger element.

---

### `icon` input now expects a CSS class string

`HubSpeedDialItemComponent` and `HubDropdownItemComponent` previously rendered the `icon` input value as raw text content. It now passes the value as a CSS class on an `<i>` element.

**Before (emoji or ligature):**

```html
<hub-speed-dial-item icon="✏️" label="Edit" /> <hub-dropdown-item icon="edit">Edit</hub-dropdown-item>
```

**After (icon-font class, e.g. Font Awesome):**

```html
<hub-speed-dial-item icon="fa-solid fa-pen" label="Edit" /> <hub-dropdown-item icon="fa-solid fa-pen">Edit</hub-dropdown-item>
```

**Migration:** update all `icon` bindings to pass a CSS class string compatible with your icon font. If you use a custom icon font, define the corresponding class.
