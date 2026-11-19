import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	DestroyRef,
	Directive,
	ElementRef,
	Injector,
	TemplateRef,
	ViewEncapsulation,
	afterNextRender,
	computed,
	contentChild,
	contentChildren,
	effect,
	inject,
	input,
	signal,
	untracked,
	viewChild
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { HubTooltipDirective } from 'ng-hub-ui-utils';
import { HubDropdownDirective } from '../../directives/dropdown.directive';
import { HubDropdownItemComponent } from '../dropdown-item/dropdown-item.component';
import { HubDropdownPanelComponent } from '../dropdown-panel/dropdown-panel.component';
import { HubButtonComponent } from '../btn/button.component';

/**
 * Marks the `<ng-template>` holding the options of the main button (`hub-dropdown-item`s).
 * Wide, they open from a caret joined to the main button; narrow, they head the `⋮` menu.
 */
@Directive({ selector: 'ng-template[hubButtonBarOptions]', standalone: true })
export class HubButtonBarOptionsDirective {
	readonly template = inject<TemplateRef<unknown>>(TemplateRef);
}

/**
 * Marks the `<ng-template>` holding what always lives in the `⋮` menu (`hub-dropdown-item`s,
 * `hub-dropdown-divider`s). It closes the menu, after the buttons that did not fit.
 */
@Directive({ selector: 'ng-template[hubButtonBarMenu]', standalone: true })
export class HubButtonBarMenuDirective {
	readonly template = inject<TemplateRef<unknown>>(TemplateRef);
}

/** A projected `hubButton` with its host element, which the bar hides, orders and clicks. */
interface BarButton {
	id: string;
	el: HTMLElement;
	button: HubButtonComponent;
}

const FOLDED = 'hub-button-bar__folded';
const SPLIT_MAIN = 'hub-button-bar__split-main';
const ids = new WeakMap<HTMLElement, string>();
let nextId = 0;
const idOf = (el: HTMLElement): string => {
	let id = ids.get(el);
	if (!id) {
		id = `hub-button-bar-${nextId++}`;
		ids.set(el, id);
	}
	return id;
};

/**
 * The button group of a page header. Its children are ordinary `hubButton`s, kept exactly as
 * written: their variant, colour, handlers and links are theirs, and the bar adds no meaning.
 * The first `solid` button is the main one and never folds; when the parent row cannot hold
 * the whole group plus `minContentWidth`, every other button folds into the `⋮` menu.
 *
 * A folded button is not moved or restyled. It stays in place, hidden, and its menu entry
 * clicks it, so whatever the button does (a handler, `href`, `routerLink`) happens the same
 * way, and a disabled or loading button stays inert from the menu as well.
 *
 * Collapse rule: the width that matters is the room in the title row, not the device. While
 * wide, the group's natural width is measured; the measure is kept while folded and refreshed
 * whenever the buttons change, so the bar unfolds as soon as the row can hold it again.
 *
 * Encapsulation is off because the bar styles elements the consumer projects (hiding folded
 * buttons, joining the main button to its caret); every selector is under `.hub-button-bar`.
 */
@Component({
	selector: 'hub-button-bar',
	standalone: true,
	imports: [
		HubButtonComponent,
		HubDropdownDirective,
		HubDropdownItemComponent,
		HubDropdownPanelComponent,
		HubTooltipDirective,
		NgTemplateOutlet
	],
	templateUrl: './button-bar.component.html',
	styleUrl: './button-bar.component.scss',
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'hub-button-bar' }
})
export class HubButtonBarComponent {
	private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
	private readonly cdr = inject(ChangeDetectorRef);

	private running: Animation[] = [];
	private ghosts: HTMLElement[] = [];

	/** Width in pixels the sibling content (usually a title) keeps before the buttons may take the whole row. */
	readonly minContentWidth = input(240);

	/** Accessible name and tooltip of the `⋮` trigger and of the split caret. */
	readonly moreLabel = input('More actions');

	private readonly buttonRefs = contentChildren(HubButtonComponent);
	private readonly buttonEls = contentChildren(HubButtonComponent, { read: ElementRef });
	private readonly optionsDef = contentChild(HubButtonBarOptionsDirective);
	private readonly menuDef = contentChild(HubButtonBarMenuDirective);

	private readonly group = viewChild<ElementRef<HTMLElement>>('group');

	private readonly narrow = signal(false);
	private fullWidth = 0;

	/** The projected buttons in DOM order; both queries list the same hosts in the same order. */
	private readonly buttons = computed<BarButton[]>(() => {
		const els = this.buttonEls();
		return this.buttonRefs().map((button, index) => {
			const el = els[index].nativeElement as HTMLElement;
			return { id: idOf(el), el, button };
		});
	});

	protected readonly main = computed(() => this.buttons().find((entry) => entry.button.variant() === 'solid') ?? null);
	protected readonly options = computed(() => this.optionsDef()?.template ?? null);
	protected readonly menu = computed(() => this.menuDef()?.template ?? null);

	/** Buttons shown as menu entries: every one but the main while narrow. */
	protected readonly folded = computed(() => (this.narrow() ? this.buttons().filter((entry) => entry !== this.main()) : []));

	/** Options sit under a caret only while wide and with a main button to hang from. */
	protected readonly split = computed(() => !this.narrow() && !!this.main() && !!this.options());
	protected readonly optionsInMenu = computed(() => !!this.options() && !this.split());
	protected readonly hasMenu = computed(() => this.optionsInMenu() || this.folded().length > 0 || !!this.menu());

	/** Flex order that puts the caret right after the main button, wherever it was written. */
	protected readonly caretOrder = computed(() => this.buttons().indexOf(this.main() as BarButton) * 2 + 1);

	constructor() {
		const injector = inject(Injector);
		// A new set of buttons (or a change that alters their width) invalidates the measure: render
		// the full group, measure it and settle before paint, without animating, so a loading flag or
		// an @if toggled while folded neither flashes the wide group nor replays the collapse.
		effect(() => {
			this.buttons().forEach(({ button }) => (button.variant(), button.size(), button.loading()));
			this.options();
			this.menu();
			untracked(() => {
				this.fullWidth = 0;
				this.narrow.set(false);
			});
			afterNextRender({ read: () => this.measure(false) }, { injector });
		});

		effect(() => {
			this.buttons();
			this.narrow();
			this.split();
			untracked(() => this.syncButtons());
		});

		const destroyRef = inject(DestroyRef);
		destroyRef.onDestroy(() => this.cancelRunning());
		// Browser only: ResizeObserver does not exist during server rendering, and the parent is known once rendered.
		afterNextRender(() => {
			const observer = new ResizeObserver(() => this.measure());
			const parent = this.host.nativeElement.parentElement ?? this.host.nativeElement;
			observer.observe(parent);
			observer.observe(this.host.nativeElement);
			destroyRef.onDestroy(() => observer.disconnect());
		});
	}

	/** Text of a folded button for its menu entry, read when the menu opens so it is current. */
	protected labelOf(entry: BarButton): string {
		return (entry.el.textContent ?? '').trim();
	}

	/** Icon class of a folded button: the first `<i>` it holds, the way `hub-dropdown-item` takes icons. */
	protected iconOf(entry: BarButton): string | undefined {
		return entry.el.querySelector('i')?.className || undefined;
	}

	/** A menu entry stands in for its button: the button's own click runs its handler or follows its link. */
	protected activate(entry: BarButton): void {
		entry.el.click();
	}

	/** Applies the fold to the projected hosts: hidden when folded, ordered, the main one joined to its caret. */
	private syncButtons(): void {
		const folded = new Set(this.folded());
		const main = this.main();
		this.buttons().forEach((entry, index) => {
			entry.el.classList.toggle(FOLDED, folded.has(entry));
			entry.el.classList.toggle(SPLIT_MAIN, entry === main && this.split());
			entry.el.style.order = String(index * 2);
			// setAttribute, not dataset: the server-side DOM has no dataset.
			entry.el.setAttribute('data-hub-button-bar-id', entry.id);
		});
	}

	/** @param animate false when settling a fresh render, where there is no previous layout to animate from. */
	private measure(animate = true): void {
		const group = this.group()?.nativeElement;
		const parent = this.host.nativeElement.parentElement ?? this.host.nativeElement;

		if (!this.narrow() && group) {
			this.fullWidth = group.offsetWidth;
		}

		if (this.fullWidth) {
			this.setNarrow(parent.clientWidth < this.fullWidth + this.minContentWidth(), animate);
		}
	}

	/**
	 * Applies a collapse flip with a FLIP animation (Web Animations API) so buttons look
	 * absorbed by, or emerging from, the `⋮` trigger. View transitions are not used: the
	 * flip almost always happens while the user drags the window edge, and browsers skip a
	 * same-document view transition when the viewport resizes during it. `element.animate`
	 * is unaffected by resizing. Everything is rect-based, so RTL needs no sign flips.
	 * Only a real flip animates; reduced motion or a missing API updates instantly. The DOM
	 * is updated synchronously (`detectChanges`) so the new rects can be read right away.
	 */
	private setNarrow(value: boolean, allowAnimation: boolean): void {
		if (value === this.narrow()) {
			return;
		}

		const animate =
			allowAnimation &&
			typeof document !== 'undefined' &&
			typeof window !== 'undefined' &&
			typeof Element.prototype.animate === 'function' &&
			!window.matchMedia('(prefers-reduced-motion: reduce)').matches;

		if (!animate) {
			this.narrow.set(value);
			this.cdr.detectChanges();
			this.syncButtons();
			return;
		}

		this.cancelRunning();
		const before = this.snapshot();
		const ghosts = new Map<string, HTMLElement>();
		// Clones are taken before the DOM update, while the old buttons are still visible.
		before.buttons.forEach((entry, id) => ghosts.set(id, entry.el.cloneNode(true) as HTMLElement));

		this.narrow.set(value);
		this.cdr.detectChanges();
		this.syncButtons();
		const after = this.snapshot();

		const trigger = after.more ?? null;
		const hub = trigger ?? before.more;
		const center = (r: DOMRect) => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
		const run = (el: Element, frames: Keyframe[], options: KeyframeAnimationOptions): Animation => {
			const animation = el.animate(frames, { fill: 'backwards', ...options });
			this.running.push(animation);
			return animation;
		};

		let order = 0;
		after.buttons.forEach((now, id) => {
			const old = before.buttons.get(id);
			if (old) {
				const dx = old.rect.left - now.rect.left;
				const dy = old.rect.top - now.rect.top;
				if (dx || dy) {
					run(now.el, [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], {
						duration: 260,
						easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)'
					});
				}
			} else if (hub) {
				const from = center(hub.rect);
				const to = center(now.rect);
				run(
					now.el,
					[
						{ transform: `translate(${from.x - to.x}px, ${from.y - to.y}px) scale(0.3)`, opacity: 0 },
						{ transform: 'none', opacity: 1 }
					],
					{ duration: 280, delay: order++ * 30, easing: 'cubic-bezier(0.34, 1.4, 0.64, 1)' }
				);
			}
		});

		const absorbed = [...before.buttons].filter(([id]) => !after.buttons.has(id));
		const target = trigger ? center(trigger.rect) : null;
		absorbed.forEach(([id, old]) => {
			const ghost = this.ghostOf(ghosts.get(id) as HTMLElement, old.rect, '1000');
			const from = center(old.rect);
			const to = target ?? from;
			const animation = run(
				ghost,
				[
					{ transform: 'none', opacity: 1 },
					{ transform: `translate(${to.x - from.x}px, ${to.y - from.y}px) scale(0.3)`, opacity: 0 }
				],
				{ duration: 240, easing: 'ease-in', fill: 'forwards' }
			);
			animation.onfinish = () => this.removeGhost(ghost);
		});

		if (before.more && after.more) {
			// Starts late so the pulse peaks as the ghosts arrive.
			const soft = value ? 1.12 : 1.06;
			run(after.more.el, [{ transform: 'scale(1)' }, { transform: `scale(${soft})` }, { transform: 'scale(1)' }], {
				duration: 240,
				delay: value ? 120 : 0,
				easing: 'ease-out'
			});
		} else if (after.more) {
			run(
				after.more.el,
				[
					{ transform: 'scale(0.3)', opacity: 0 },
					{ transform: 'none', opacity: 1 }
				],
				{ duration: 240, easing: 'ease-out' }
			);
		} else if (before.more) {
			const ghost = this.ghostOf(before.more.el.cloneNode(true) as HTMLElement, before.more.rect);
			const animation = run(
				ghost,
				[
					{ transform: 'none', opacity: 1 },
					{ transform: 'scale(0.3)', opacity: 0 }
				],
				{
					duration: 240,
					easing: 'ease-in',
					fill: 'forwards'
				}
			);
			animation.onfinish = () => this.removeGhost(ghost);
		}
	}

	/** Pins a clone over the place its original occupied, outside the bar, so it can fly off. */
	private ghostOf(clone: HTMLElement, rect: DOMRect, zIndex = ''): HTMLElement {
		clone.classList.remove(FOLDED);
		clone.removeAttribute('data-hub-button-bar-id');
		clone.removeAttribute('id');
		clone.setAttribute('aria-hidden', 'true');
		Object.assign(clone.style, {
			position: 'fixed',
			margin: '0',
			left: `${rect.left}px`,
			top: `${rect.top}px`,
			width: `${rect.width}px`,
			height: `${rect.height}px`,
			pointerEvents: 'none',
			zIndex
		});
		document.body.appendChild(clone);
		this.ghosts.push(clone);
		return clone;
	}

	/** Bounding rects of every visible button (by id) and of the `⋮` trigger. */
	private snapshot(): {
		buttons: Map<string, { el: HTMLElement; rect: DOMRect }>;
		more?: { el: HTMLElement; rect: DOMRect };
	} {
		const root = this.host.nativeElement;
		const read = (el: HTMLElement) => ({ el, rect: el.getBoundingClientRect() });
		const buttons = new Map<string, { el: HTMLElement; rect: DOMRect }>();
		root.querySelectorAll<HTMLElement>('[data-hub-button-bar-id]').forEach((el) => {
			if (!el.classList.contains(FOLDED)) {
				buttons.set(el.dataset['hubButtonBarId'] as string, read(el));
			}
		});
		const more = root.querySelector<HTMLElement>('[data-hub-button-bar-more]');
		return { buttons, more: more ? read(more) : undefined };
	}

	/** Stops a flip still in flight and drops its ghosts, so a new flip starts from the real layout. */
	private cancelRunning(): void {
		this.running.forEach((animation) => animation.cancel());
		this.running = [];
		[...this.ghosts].forEach((ghost) => this.removeGhost(ghost));
	}

	private removeGhost(ghost: HTMLElement): void {
		ghost.remove();
		this.ghosts = this.ghosts.filter((g) => g !== ghost);
	}
}
