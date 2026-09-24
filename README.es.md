# ng-hub-ui-buttons

**Español** | [English](./README.md)

[![NPM Version](https://img.shields.io/npm/v/ng-hub-ui-buttons.svg)](https://www.npmjs.com/package/ng-hub-ui-buttons)
[![Angular](https://img.shields.io/badge/Angular-21%2B-red.svg)](https://angular.dev)
[![License](https://img.shields.io/npm/l/ng-hub-ui-buttons.svg)](LICENSE)

Sistema de botones completo para Angular 21+ — botones estándar, FAB, speed dial y dropdown overlay — totalmente basado en signals, sin dependencias externas más allá de `ng-hub-ui-utils`.

## Documentación y ejemplos

Este paquete forma parte de [Hub UI](https://hubui.dev/en/), una colección de librerías de componentes Angular para aplicaciones standalone.

- Docs: https://hubui.dev/en/buttons/overview/
- Ejemplos: https://hubui.dev/en/buttons/examples/
- Hub UI: https://hubui.dev/en/
- Hub UI en GitHub (incidencias, roadmap y cómo contribuir): https://github.com/hub-env/hub-ui

## Familia de librerías `ng-hub-ui`

Esta librería forma parte del ecosistema **ng-hub-ui**:

- [**ng-hub-ui-accordion**](https://www.npmjs.com/package/ng-hub-ui-accordion) _(deprecado — usa ng-hub-ui-panels)_
- [**ng-hub-ui-action-sheet**](https://www.npmjs.com/package/ng-hub-ui-action-sheet)
- [**ng-hub-ui-avatar**](https://www.npmjs.com/package/ng-hub-ui-avatar)
- [**ng-hub-ui-board**](https://www.npmjs.com/package/ng-hub-ui-board)
- [**ng-hub-ui-breadcrumbs**](https://www.npmjs.com/package/ng-hub-ui-breadcrumbs)
- [**ng-hub-ui-buttons**](https://www.npmjs.com/package/ng-hub-ui-buttons) ← Estás aquí
- [**ng-hub-ui-calendar**](https://www.npmjs.com/package/ng-hub-ui-calendar)
- [**ng-hub-ui-dropdown**](https://www.npmjs.com/package/ng-hub-ui-dropdown) _(deprecado — usa ng-hub-ui-buttons)_
- [**ng-hub-ui-forms**](https://www.npmjs.com/package/ng-hub-ui-forms)
- [**ng-hub-ui-history**](https://www.npmjs.com/package/ng-hub-ui-history)
- [**ng-hub-ui-milestones**](https://www.npmjs.com/package/ng-hub-ui-milestones)
- [**ng-hub-ui-modal**](https://www.npmjs.com/package/ng-hub-ui-modal)
- [**ng-hub-ui-nav**](https://www.npmjs.com/package/ng-hub-ui-nav)
- [**ng-hub-ui-paginable**](https://www.npmjs.com/package/ng-hub-ui-paginable)
- [**ng-hub-ui-panels**](https://www.npmjs.com/package/ng-hub-ui-panels)
- [**ng-hub-ui-portal**](https://www.npmjs.com/package/ng-hub-ui-portal)
- [**ng-hub-ui-skeleton**](https://www.npmjs.com/package/ng-hub-ui-skeleton)
- [**ng-hub-ui-sortable**](https://www.npmjs.com/package/ng-hub-ui-sortable)
- [**ng-hub-ui-stepper**](https://www.npmjs.com/package/ng-hub-ui-stepper)
- [**ng-hub-ui-toast**](https://www.npmjs.com/package/ng-hub-ui-toast)
- [**ng-hub-ui-utils**](https://www.npmjs.com/package/ng-hub-ui-utils)

---

## Descripción

`ng-hub-ui-buttons` es una librería de botones sin dependencias externas para aplicaciones Angular 21+ standalone (peer: `ng-hub-ui-utils`). Incluye `HubButtonComponent` para botones en flujo — usable como elemento (`<hub-button>`) o como atributo sobre un host nativo (`<button hubButton>` / `<a hubButton>`) — `HubFabComponent` para acciones flotantes en posición fija, `HubSpeedDialComponent` para menús FAB expandibles y `HubDropdownDirective` que adjunta cualquier `<ng-template>` a cualquier trigger mediante `OverlayService` — sin CDK. Todas las entradas usan la API de Signals de Angular. Cada propiedad visual es una CSS custom property, por lo que todo el sistema se tematiza con una sola hoja de estilos.

## Características

- **API basada en Signals** — todas las entradas usan `input()`, `model()` y `output()`; compatible con `OnPush` y aplicaciones zoneless.
- **Cinco variantes × nueve colores** — `solid`, `outline`, `soft`, `ghost` y `link`, disponibles en `primary`, `secondary`, `success`, `danger`, `warning`, `info`, `neutral`, `light` y `dark`.
- **Cuatro tamaños** — `sm`, `md`, `lg`, `xl` con padding y fuente proporcionales.
- **FAB con nueve posiciones** — posicionamiento fijo en cualquier esquina, centro de borde o centro de pantalla con propiedades lógicas CSS (compatible con RTL).
- **Speed Dial** — menú FAB expandible con modelo bidireccional `isOpen`, expansión direccional y cierre con Escape.
- **Dropdown overlay** — adjunta cualquier `<ng-template>` a cualquier trigger; ocho opciones de placement que se dan la vuelta al borde contrario cuando el panel no cabe, trigger por click o hover, cierre al hacer clic fuera.
- **Acciones de fila entre bibliotecas** — `hubActionsAdapter` dibuja los botones y menús de fila de otra biblioteca con estos componentes, sin dependencia en ninguna dirección.
- **Sistema de tokens SCSS extensible** — defaults con `:where()` (especificidad cero) para que cualquier regla del consumidor tenga prioridad. API de mixins públicos para registrar colores semánticos personalizados.

---

## Inicio rápido

### 1. Instalación

```bash
npm install ng-hub-ui-buttons ng-hub-ui-utils
```

> **Theming (recomendado):** instala los design tokens compartidos:
>
> ```bash
> npm install ng-hub-ui-ds
> ```
>
> ```css
> @import 'ng-hub-ui-ds/styles/tokens/hub-tokens.css';
> ```

### 2. Importa los componentes que necesites

Todos los exports son standalone — importa solo lo que uses:

```typescript
import {
	HubButtonComponent,
	HubDropdownDirective,
	HubDropdownPanelComponent,
	HubDropdownItemComponent
} from 'ng-hub-ui-buttons';

@Component({
	standalone: true,
	imports: [HubButtonComponent, HubDropdownDirective, HubDropdownPanelComponent, HubDropdownItemComponent],
	template: `
		<hub-button [hubDropdown]="menu" placement="bottom-start">Acciones</hub-button>

		<ng-template #menu>
			<hub-dropdown-panel>
				<hub-dropdown-item (itemClick)="edit()">Editar</hub-dropdown-item>
				<hub-dropdown-item color="danger" (itemClick)="delete()">Eliminar</hub-dropdown-item>
			</hub-dropdown-panel>
		</ng-template>
	`
})
export class MyComponent {}
```

---

## Componentes y directivas

### `HubButtonComponent` — `<hub-button>` o `[hubButton]`

Un único componente con selector dual — úsalo como **elemento** o como **atributo** sobre un host nativo. Ambas formas comparten los mismos inputs y renderizan el spinner de carga.

| Input      | Tipo                                                                                                                                                                                                               | Por defecto | Descripción                                                                                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `variant`  | `solid \| outline \| soft \| ghost \| link`                                                                                                                                                                        | `solid`     | Estilo visual                                                                                                                                                 |
| `color`    | `HubSemanticColor` — los nueve integrados (`primary \| secondary \| success \| danger \| warning \| info \| neutral \| light \| dark`) **o cualquier acento personalizado** registrado con `hub-btn-color-rules()` | `primary`   | Color semántico (conjunto abierto)                                                                                                                            |
| `size`     | `sm \| md \| lg \| xl`                                                                                                                                                                                             | `md`        | Escala de tamaño                                                                                                                                              |
| `loading`  | `boolean`                                                                                                                                                                                                          | `false`     | Muestra el spinner y marca el botón **ocupado + deshabilitado** — no enfocable, inerte a puntero/teclado, refleja `aria-busy="true"` y el atributo `disabled` |
| `disabled` | `boolean`                                                                                                                                                                                                          | `false`     | Desactiva el botón y añade el atributo `disabled`                                                                                                             |

```html
<!-- Forma elemento -->
<hub-button variant="solid" color="primary">Guardar</hub-button>

<!-- Forma atributo sobre host nativo (recomendada para semántica de botón real) -->
<button hubButton variant="outline" color="success">Confirmar</button>
<a hubButton variant="link" color="primary" href="/docs">Leer más</a>
```

> **Consejo:** usa la forma atributo sobre un `<button>` / `<a>` nativo cuando necesites semántica de botón real (foco, teclado, envío de formularios). La forma elemento `<hub-button>` es un host de estilo, pero se anuncia con `role="button"`, un `tabindex` enfocable y activación con Enter/Espacio para seguir siendo accesible por teclado; como entonces se comporta como un botón, no lo anides dentro de otro elemento interactivo.
>
> **Alias deprecados:** `HubBtnComponent` y `HubBtnDirective` se siguen exportando (apuntando a `HubButtonComponent`) por compatibilidad — migra a `HubButtonComponent`.

#### Estado loading / ocupado

```html
<button hubButton color="primary" [loading]="saving()">Guardar</button>
```

Mientras `loading` es `true` el botón muestra un spinner animado y queda totalmente inerte: refleja `aria-busy="true"` y el atributo `disabled` nativo, sale del orden de tabulación e ignora la activación por puntero y teclado — así un envío en curso no se dispara dos veces.

El glifo del spinner es el token intercambiable `--hub-button-spinner` (un `url("data:image/svg+xml,…")` pintado con `mask`, por lo que hereda el color de texto del botón). Apúntalo a cualquier SVG para sustituir el loader, y ajusta `--hub-button-spinner-duration` / `--hub-button-spinner-size`:

```css
hub-button,
[hubButton] {
	--hub-button-spinner: url('data:image/svg+xml,%3Csvg …%3E'); /* tu loader */
	--hub-button-spinner-duration: 1s;
}
```

### `HubFabComponent` — `<hub-fab>`

| Input              | Tipo                                                                                                                        | Por defecto  | Descripción                                                                                                                   |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `position`         | `top-start \| top-center \| top-end \| middle-start \| center \| middle-end \| bottom-start \| bottom-center \| bottom-end` | `bottom-end` | Posición fija en el viewport                                                                                                  |
| `size`             | `mini \| standard \| large`                                                                                                 | `standard`   | Tamaño del botón                                                                                                              |
| `color`            | semántico                                                                                                                   | `primary`    | Color                                                                                                                         |
| `extended`         | `boolean`                                                                                                                   | `false`      | Renderiza la variante píldora con una etiqueta proyectada junto al icono                                                      |
| `collapseOnScroll` | `boolean`                                                                                                                   | `false`      | Colapsa un FAB extendido a solo icono mientras la página está desplazada más de 50px, y lo vuelve a expandir cerca del inicio |
| `disabled`         | `boolean`                                                                                                                   | `false`      | Desactiva el botón                                                                                                            |

Output: `fabClick`.

Slots de contenido: `[slot=icon]` se renderiza siempre; `[slot=label]`, solo en la forma extendida. Un FAB no extendido proyecta su contenido por defecto en lugar de la etiqueta.

```html
<hub-fab extended aria-label="Nuevo documento">
	<i slot="icon" class="fa-solid fa-plus"></i>
	<span slot="label">Nuevo documento</span>
</hub-fab>
```

> El elemento anfitrión _es_ el control, así que se anuncia con `role="button"`, un `tabindex` enfocable y activación con Enter/Espacio. No lo anides dentro de otro elemento interactivo y dale un `aria-label` cuando solo contenga un icono.

### `HubSpeedDialComponent` — `<hub-speed-dial>`

| Input / Output | Tipo                          | Por defecto  | Descripción                                      |
| -------------- | ----------------------------- | ------------ | ------------------------------------------------ |
| `isOpen`       | `model(false)`                | `false`      | Binding bidireccional del estado abierto/cerrado |
| `position`     | igual que FAB                 | `bottom-end` | Posición fija en el viewport                     |
| `size`         | `mini \| standard \| large`   | `standard`   | Tamaño del botón trigger                         |
| `color`        | semántico                     | `primary`    | Color del botón trigger                          |
| `direction`    | `up \| down \| left \| right` | `up`         | Dirección en que se expanden los items           |
| `trigger`      | `click \| hover`              | `click`      | Interacción que abre el speed dial               |

Outputs: `opened`, `closed`, más `isOpenChange` del modelo bidireccional `isOpen`. Métodos: `open()`, `close()`, `toggle()`. Se cierra con Escape.

Usa `hubTrigger` en el elemento proyectado como botón trigger:

```html
<hub-speed-dial>
	<hub-button hubTrigger color="primary"><i class="fa-solid fa-plus"></i></hub-button>
	<hub-speed-dial-item icon="fa-solid fa-pen" label="Editar" (itemClick)="edit()" />
	<hub-speed-dial-item icon="fa-solid fa-trash" label="Eliminar" color="danger" (itemClick)="delete()" />
</hub-speed-dial>
```

### `HubSpeedDialItemComponent` — `<hub-speed-dial-item>`

| Input      | Tipo                   | Por defecto | Descripción                                                           |
| ---------- | ---------------------- | ----------- | --------------------------------------------------------------------- |
| `icon`     | `string`               | —           | Clase(s) CSS aplicadas a un elemento `<i>` (p. ej. `fa-solid fa-pen`) |
| `label`    | `string`               | —           | Etiqueta tooltip junto al item                                        |
| `color`    | semántico \| `default` | `default`   | Color del botón; `default` mantiene la apariencia neutra              |
| `disabled` | `boolean`              | `false`     | Desactiva el item                                                     |

Output: `itemClick`.

### `HubDropdownDirective` — `[hubDropdown]`

| Input           | Tipo                                                                                  | Por defecto    | Descripción                                                                                                                                                                                                                                                                                                     |
| --------------- | ------------------------------------------------------------------------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `hubDropdown`   | `TemplateRef`                                                                         | —              | Template del panel a renderizar en el overlay (requerido)                                                                                                                                                                                                                                                       |
| `placement`     | `bottom-start \| bottom \| bottom-end \| top-start \| top \| top-end \| start \| end` | `bottom-start` | Posición preferida del overlay respecto al trigger. Se usa siempre que el panel quepa ahí; si no, se da la vuelta al borde contrario — `bottom` a `top`, `end` a `start` — en el eje que se saliera. `start` y `end` son lógicos, así que un trigger en RTL se gira hacia el borde donde de verdad tiene sitio. |
| `trigger`       | `click \| hover`                                                                      | `click`        | Evento que abre el dropdown                                                                                                                                                                                                                                                                                     |
| `closeOnSelect` | `boolean`                                                                             | `true`         | Cierra al hacer clic dentro del panel                                                                                                                                                                                                                                                                           |
| `disabled`      | `boolean`                                                                             | `false`        | Impide la apertura                                                                                                                                                                                                                                                                                              |
| `offsetY`       | `number`                                                                              | `4`            | Separación en px entre trigger y panel                                                                                                                                                                                                                                                                          |
| `panelClass`    | `string`                                                                              | `''`           | Clase CSS adicional en el panel overlay                                                                                                                                                                                                                                                                         |
| `isOpen`        | `model(false)`                                                                        | —              | Estado bidireccional abierto/cerrado                                                                                                                                                                                                                                                                            |

Outputs: `opened`, `closed`. Métodos: `open()`, `close()`, `toggle()`. Se cierra con Escape y con un clic fuera. Un panel abierto sigue abierto mientras la página se mueve y se vuelve a anclar a su trigger — al hacer scroll, al redimensionar la ventana y cuando el propio trigger se mueve —, y cada vez vuelve a decidir si sigue cabiendo donde está. Solo hay un desplegable abierto a la vez: abrir cualquiera cierra el que estuviera abierto, se haya abierto como se haya abierto.

### `HubDropdownPanelComponent` — `<hub-dropdown-panel>`

Contenedor del contenido del dropdown. Acepta un input `color` para mostrar un borde de acento semántico en el borde superior.

### `HubDropdownItemComponent` — `<hub-dropdown-item>`

| Input      | Tipo                   | Por defecto | Descripción                                            |
| ---------- | ---------------------- | ----------- | ------------------------------------------------------ |
| `color`    | semántico \| `default` | `default`   | Color del texto                                        |
| `icon`     | `string`               | —           | Clase(s) CSS aplicadas a un `<i>` antes de la etiqueta |
| `disabled` | `boolean`              | `false`     | Desactiva el click y atenúa el item                    |
| `selected` | `boolean`              | `false`     | Muestra un indicador de selección                      |

Output: `itemClick`.

### `HubDropdownDividerComponent` — `<hub-dropdown-divider>`

Separador horizontal con `role="separator"`.

### `HubDropdownHeaderComponent` — `<hub-dropdown-header>`

Etiqueta de grupo en mayúsculas dentro de un panel dropdown.

### `hubActionsAdapter` — acciones de fila entre bibliotecas

Permite que una biblioteca anfitriona dibuje sus acciones de fila con el botón y el desplegable
de esta, **sin que ninguna de las dos dependa de la otra**. Es la misma disposición que
`hubFormControlAdapter` usa para los campos de una tabla: la anfitriona describe lo que ofrece
una fila en términos neutros —iconos, etiquetas, `disabled`, las acciones dentro de un menú— y
esto traduce la descripción a los componentes reales. Los tipos se declaran aquí y reflejan
estructuralmente los de la anfitriona, así que no se importa nada a través de la frontera y la
aplicación es el único sitio que sabe que ambas existen.

```ts
import { provideHubPaginableActions } from 'ng-hub-ui-paginable';
import { hubActionsAdapter } from 'ng-hub-ui-buttons';

export const appConfig: ApplicationConfig = {
	providers: [provideHubPaginableActions(hubActionsAdapter)]
};
```

### `HubActionsCellComponent` — `<hub-actions-cell>`

El componente que crea ese adaptador, a partir de un único `config: HubActionsCellConfig`
obligatorio. Es público porque crear un componente es la forma honesta de ensamblar
`hubDropdown`: necesita un elemento anfitrión y un `ng-template`, lo cual es natural en una
plantilla e incómodo por código. El clic sobre una de sus acciones se detiene ahí, así que una
acción dibujada dentro de una fila pulsable no dispara además la fila.

---

## Personalización CSS

Todas las propiedades visuales son CSS custom properties con `:where()` (especificidad cero), por lo que cualquier regla del consumidor las sobreescribe sin `!important`.

```css
/* Botón */
--hub-button-padding-x: var(--hub-ref-space-3, 1rem);
--hub-button-padding-y: var(--hub-ref-space-2, 0.5rem);
--hub-button-border-radius: var(--hub-sys-radius-md, 0.375rem);
--hub-button-border-width: 1.5px;
--hub-button-font-size: var(--hub-ref-font-size-base, 1rem);
--hub-button-font-weight: var(--hub-ref-font-weight-medium, 500);
--hub-button-gap: var(--hub-ref-space-2, 0.5rem);
--hub-button-transition: var(--hub-sys-transition-fast, all 0.15s ease-in-out);
--hub-button-spinner-size: 0.875em;
--hub-button-spinner-duration: 0.7s;
--hub-button-spinner: url('data:image/svg+xml,…'); /* el glifo de carga — cámbialo por cualquier SVG */
--hub-button-disabled-opacity: var(--hub-sys-opacity-disabled, 0.65);

/* Borde del botón de contorno — el acento llevado a una ventana de luminosidad para que el borde llegue a 3:1 (WCAG 1.4.11) */
--hub-btn-border-lightness-min: var(--hub-sys-emphasis-lightness-min, 0);
--hub-btn-border-lightness-max: max(var(--hub-sys-emphasis-lightness-max, 0.45), 0.62);
--hub-btn-accent-border: oklch(from var(--hub-btn-accent) clamp(var(--hub-btn-border-lightness-min), l, var(--hub-btn-border-lightness-max)) c h);

/* Slots de interacción del botón (familias hover / pressed reconfigurables) */
--hub-btn-hover-bg: var(--hub-btn-accent-subtle);
--hub-btn-hover-border: transparent;
--hub-btn-hover-color: var(--hub-btn-accent-emphasis);
--hub-btn-active-bg: color-mix(in oklch, var(--hub-btn-accent) 70%, var(--hub-sys-color-ink, #212529));
--hub-btn-active-border: transparent;
--hub-btn-active-color: var(--hub-btn-accent-on);

/* FAB */
--hub-fab-size-mini: 2.5rem;
--hub-fab-size-standard: 3.5rem;
--hub-fab-size-large: 4.5rem;
--hub-fab-border-radius: 50%;
--hub-fab-shadow: var(--hub-sys-shadow-md, 0 0.5rem 1rem rgba(0, 0, 0, 0.15));
--hub-fab-shadow-hover: var(--hub-sys-shadow-lg, 0 1rem 3rem rgba(0, 0, 0, 0.175));
--hub-fab-offset: var(--hub-ref-space-3, 1rem);
--hub-fab-zindex: var(--hub-sys-zindex-fixed, 1030);
--hub-fab-transition: box-shadow 0.2s ease, transform 0.15s ease;
--hub-fab-extended-height: 3.5rem;
--hub-fab-extended-radius: 1.75rem;
--hub-fab-extended-padding-x: 1.25rem;

/* Speed Dial */
--hub-speed-dial-gap: 0.625rem;
--hub-speed-dial-zindex: var(--hub-sys-zindex-fixed, 1030);
--hub-speed-dial-animation: 0.2s ease;

/* Panel del dropdown */
--hub-dropdown-panel-min-width: 11.25rem;
--hub-dropdown-panel-max-height: 20rem;
--hub-dropdown-panel-padding-y: var(--hub-ref-space-1, 0.25rem);
--hub-dropdown-panel-bg: var(--hub-sys-color-surface-default, #ffffff);
--hub-dropdown-panel-border-color: var(--hub-sys-color-border-subtle, #dee2e6);
--hub-dropdown-panel-border-radius: var(--hub-sys-radius-md, 0.375rem);
--hub-dropdown-panel-shadow: var(--hub-sys-shadow-lg, 0 1rem 3rem rgba(0, 0, 0, 0.175));
--hub-dropdown-panel-zindex: var(--hub-sys-zindex-dropdown, 1000);

/* Item del dropdown */
--hub-dropdown-item-padding-x: var(--hub-ref-space-3, 1rem);
--hub-dropdown-item-padding-y: var(--hub-ref-space-2, 0.5rem);
--hub-dropdown-item-hover-bg: var(--hub-sys-color-surface-subtle, #f8f9fa);
--hub-dropdown-item-border-radius: var(--hub-sys-radius-sm, 0.25rem);
--hub-dropdown-item-disabled-opacity: 0.45;
```

Los colores semánticos se resuelven mediante los tokens `--hub-sys-color-{variant}-*` de `ng-hub-ui-ds`.

---

## API de mixins SCSS

Registra colores semánticos personalizados sin modificar la librería. Importa la API de mixins desde los estilos distribuidos:

```scss
@use 'ng-hub-ui-buttons/styles' as hub;
```

### Añadir un color personalizado a las cinco variantes de botón

`hub-btn-color-rules('brand')` apunta el slot local `--hub-btn-accent` a
`--hub-sys-color-brand`. Solo defines ese **único** valor — el botón deriva toda
la familia de roles (`-emphasis` / `-subtle` / `-on`) en runtime, así que cada
apariencia (solid/outline/soft/ghost/link) funciona y `color="brand"` compila
(el input `color` es un conjunto abierto):

```scss
:root {
	--hub-sys-color-brand: #ff6b00; // el único acento — con eso basta
}

hub-button,
[hubButton] {
	@include hub.hub-btn-color-rules('brand');
}
```

### Crear una variante completamente personalizada

`hub-btn-variant-rules` es el primitivo genérico — **todos los parámetros van con
nombre** (no hay `$type` posicional). Sus defaults coinciden con la variante
`ghost` y cada color lee la familia local `--hub-btn-accent*`, así que es
agnóstico al acento. Sobreescribe solo lo que difiera:

```scss
hub-button,
[hubButton] {
	&.hub-btn-inverted.hub-btn-brand {
		@include hub.hub-btn-variant-rules(
			$bg: var(--hub-btn-accent-on),
			$color: var(--hub-btn-accent),
			$border: var(--hub-btn-accent),
			$hover-bg: var(--hub-btn-accent),
			$hover-color: var(--hub-btn-accent-on)
		);
	}
}
```

### Añadir un color personalizado al FAB

```scss
@include hub.hub-fab-color('brand');
```

### Añadir un color personalizado al dropdown

```scss
// Borde de acento del panel
@include hub.hub-dropdown-panel-color('brand');

// Texto y hover del item
@include hub.hub-dropdown-item-color('brand');
```

### Mixins disponibles

| Mixin                                                                        | Contexto                                                    | Descripción                                                                                                          |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `hub-btn-variant-rules($bg, $color, $border, $hover-*, $active-*, …)`        | dentro de un selector de variante `hub-button, [hubButton]` | Primitivo genérico — cada propiedad de apariencia como parámetro **con nombre** (sin `$type` posicional)             |
| `hub-btn-color-rules($type)`                                                 | bloque `hub-button, [hubButton]`                            | Registra un acento personalizado (`--hub-btn-accent` → `--hub-sys-color-$type`); las cinco apariencias derivan de él |
| `hub-btn-theme($accent, $border-radius, $padding-x, $padding-y, $font-size)` | cualquier selector que contenga botones                     | Tematización por tokens en una llamada — todos los parámetros son opcionales y solo se emiten los que pases          |
| `hub-fab-color($type)`                                                       | raíz                                                        | Regla global `.hub-fab-{type}`                                                                                       |
| `hub-dropdown-panel-color($type)`                                            | raíz                                                        | Regla global de color para `hub-dropdown-panel`                                                                      |
| `hub-dropdown-panel-color-rules($type)`                                      | dentro de selector `hub-dropdown-panel`                     | Solo propiedades CSS — tú eliges el selector                                                                         |
| `hub-dropdown-item-color($type)`                                             | raíz                                                        | Regla global de color para `hub-dropdown-item`                                                                       |
| `hub-dropdown-item-color-rules($type)`                                       | dentro de `.hub-dropdown-item__inner`                       | Solo propiedades CSS — tú eliges el selector                                                                         |

---

## Migración desde `ng-hub-ui-dropdown`

`ng-hub-ui-dropdown` está deprecado. Sustituye:

| Antes                 | Ahora                                                             |
| --------------------- | ----------------------------------------------------------------- |
| `HubDropdownModule`   | `HubDropdownDirective` + `HubDropdownPanelComponent`              |
| `<hub-dropdown>`      | `[hubDropdown]="tpl"` en cualquier trigger + `<ng-template #tpl>` |
| `<hub-dropdown-item>` | `<hub-dropdown-item>` (mismo selector, nuevo paquete)             |

---

## Contribuir

¡Las contribuciones son bienvenidas! Abre una issue o envía un pull request en [GitHub](https://github.com/hub-env/ng-hub-ui-buttons).

### Proceso de Pull Request

1. Haz un fork del repositorio
2. Crea una nueva rama: `git checkout -b feat/mi-nueva-feature`
3. Realiza tus cambios
4. Añade pruebas para cualquier funcionalidad nueva
5. Actualiza la documentación si es necesario
6. Envía un Pull Request

### Directrices de desarrollo

- Escribe pruebas unitarias para las nuevas funcionalidades
- Sigue la guía de estilo de Angular
- Actualiza la documentación ante cambios en la API
- Mantén la compatibilidad hacia atrás
- Añade comentarios JSDoc para la lógica compleja

### Convención de commits

Seguimos [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Nuevas funcionalidades
- `fix:` Corrección de errores
- `docs:` Cambios en documentación
- `refactor:` Refactorizaciones
- `test:` Añadir o actualizar tests
- `chore:` Tareas de mantenimiento

### Reportar incidencias

Antes de crear una incidencia, por favor:

- Revisa las incidencias existentes
- Incluye los pasos para reproducir el problema
- Especifica tu entorno (versión de Angular, navegador)

---

## Breaking changes

Ver [BREAKING_CHANGES.md](./BREAKING_CHANGES.md).

## Changelog

Ver [CHANGELOG.md](./CHANGELOG.md).

---

## ☕ Apoyar el proyecto

Si este proyecto te resulta útil y quieres apoyar su desarrollo, puedes invitarme a un café:

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/carlosmorcillo)

¡Tu apoyo es muy apreciado y ayuda a mantener y mejorar este proyecto!

## 💼 Soporte comercial

Mantengo estas librerías yo mismo: soy [Carlos Morcillo Fernández](https://www.carlosmorcillo.com), arquitecto frontend autónomo, y trabajo con equipos que construyen y mantienen aplicaciones Angular.

Si tu equipo depende de Hub-UI y necesita más de lo que se resuelve en un hilo de incidencias, eso es a lo que me dedico: auditorías de arquitectura, sistemas de diseño, migraciones de Angular y mentoría de equipos. Cuando el proyecto pide además diseño y un equipo completo, lo llevo por [Frog Hub](https://froghub.es), mi estudio de desarrollo.

Aquí están [los servicios](https://www.carlosmorcillo.com/servicios/) y aquí puedes [contarme tu proyecto](https://www.carlosmorcillo.com/contacto/).

## 📄 Licencia

Este proyecto está licenciado bajo la Licencia MIT — consulta el archivo [LICENSE](LICENSE) para más detalles.

---

Hecho con ❤️ por [Carlos Morcillo Fernández](https://www.carlosmorcillo.com)
