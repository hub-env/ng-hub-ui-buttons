import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
	DestroyRef,
	Directive,
	ElementRef,
	PLATFORM_ID,
	TemplateRef,
	ViewContainerRef,
	booleanAttribute,
	inject,
	input,
	model,
	output,
	signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription, fromEvent } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { OverlayService } from 'ng-hub-ui-utils';
import type { OverlayRef } from 'ng-hub-ui-utils';
import { HubDropdownPlacement } from '../models/button.types';
import { hubDropdownPositions } from './dropdown-positions';

/**
 * The one dropdown currently open, anywhere on the page.
 *
 * Closing on click-outside already made a second one *usually* replace the first, since
 * opening it is itself a click outside the first. Usually is not a guarantee: a dropdown
 * opened from code — a keyboard shortcut, a menu restored after a re-render, a table row
 * that opens its own — produces no such click, and two panels stay up at once. Held in a
 * module variable rather than a service because the rule is about the page, not about
 * anything injectable, and a service would make every consumer provide one to get it.
 */
let openDropdown: HubDropdownDirective | null = null;

/**
 * Turns any host element into a dropdown trigger.
 * Renders an ng-template in a body-level overlay managed by OverlayService (no CDK).
 * When closeOnSelect is true, any click inside the panel closes the overlay automatically.
 *
 * Only one dropdown is open at a time: opening one closes whichever was already open,
 * however it was opened.
 */
@Directive({
	selector: '[hubDropdown]',
	standalone: true,
	exportAs: 'hubDropdown',
	host: {
		'(click)': '_onHostClick()',
		'(mouseenter)': '_onHostEnter()',
		'(mouseleave)': '_onHostLeave()'
	}
})
export class HubDropdownDirective {
	/** The ng-template to render inside the overlay panel. */
	tpl = input.required<TemplateRef<any>>({ alias: 'hubDropdown' });
	/**
	 * Where the panel goes when it fits there, which is the only promise a placement can keep:
	 * a panel drawn outside the viewport is unusable whatever the consumer asked for. When it
	 * does not fit, the panel flips across the edge it would have overflowed — see
	 * {@link hubDropdownPositions} for the chain and why it is ordered as it is.
	 */
	placement = input<HubDropdownPlacement>('bottom-start');
	trigger = input<'click' | 'hover'>('click');
	/**
	 * When true, any click inside the panel content closes the dropdown.
	 *
	 * Transformed, so the bare HTML form works: `closeOnSelect` on its own passes the empty
	 * string an attribute without a value carries, which an untransformed `input(true)`
	 * rejects at compile time. Same for {@link disabled}.
	 */
	closeOnSelect = input(true, { transform: booleanAttribute });
	disabled = input(false, { transform: booleanAttribute });
	/** Vertical offset in pixels between the trigger and the panel. */
	offsetY = input(4);
	panelClass = input('');
	isOpen = model(false);
	opened = output<void>();
	closed = output<void>();

	private _overlayRef: OverlayRef | null = null;

	/**
	 * How long, in milliseconds, the pointer is allowed to be over neither the trigger nor
	 * the panel before a hover dropdown closes. The panel is body-level and sits `offsetY`
	 * away from its trigger, so leaving the trigger is not yet a dismissal — leaving it and
	 * arriving nowhere is.
	 */
	private static readonly HOVER_GRACE_MS = 150;

	private _hoverCloseTimer: ReturnType<typeof setTimeout> | null = null;

	/** Enter/leave listeners on the attached panel, live only while a hover dropdown is open. */
	private _panelHover: Subscription | null = null;
	/**
	 * Everything open() subscribes to for this cycle only. take(1) retires each one when it
	 * fires, but a dropdown closed by Escape or from code never fires them: they
	 * would survive holding the detached panel and close the NEXT panel on the first click
	 * inside it, which is the very thing closeOnSelect: false is meant to prevent.
	 */
	private _openSubs: Subscription | null = null;

	private readonly _el = inject(ElementRef<HTMLElement>);
	private readonly _vcr = inject(ViewContainerRef);
	private readonly _overlay = inject(OverlayService);
	private readonly _destroyRef = inject(DestroyRef);
	private readonly _document = inject(DOCUMENT);

	constructor() {
		// Escape-to-close relies on DOM events; inert on the server (SSR/prerender).
		if (isPlatformBrowser(inject(PLATFORM_ID))) {
			fromEvent<KeyboardEvent>(this._document, 'keydown')
				.pipe(
					filter((e) => e.key === 'Escape' && this.isOpen()),
					takeUntilDestroyed(this._destroyRef)
				)
				.subscribe(() => this.close());
		}

		// Torn down silently, not closed. `close()` emits `closed`, and a component that
		// is already gone has nobody to tell — Angular reports that as NG0953. Two things
		// have to go: the overlay, which lives on the body and would otherwise outlive the
		// view that owns it, and this directive's place as the one open dropdown, which
		// would leave a destroyed instance to be closed by whoever opens the next one.
		this._destroyRef.onDestroy(() => {
			if (openDropdown === this) {
				openDropdown = null;
			}

			this._stopHoverTracking();
			this._overlayRef?.detach();
			this._overlayRef?.dispose();
			this._overlayRef = null;
		});
	}

	/** Open the dropdown and mount the overlay, closing whichever one was open. */
	open(): void {
		if (this.disabled() || this.isOpen()) return;

		openDropdown?.close();
		openDropdown = this;

		const positionStrategy = this._overlay
			.position()
			.flexibleConnectedTo(this._el)
			.withPositions(hubDropdownPositions(this.placement(), this.offsetY()));

		const panelClasses = ['hub-dropdown-overlay'];
		if (this.panelClass()) panelClasses.push(this.panelClass());

		this._overlayRef = this._overlay.create({ positionStrategy, panelClass: panelClasses });

		const panelEl = this._overlayRef.attach(this.tpl(), this._vcr);

		this._openSubs = new Subscription();

		// Close on click-inside when closeOnSelect is true
		if (this.closeOnSelect() && panelEl) {
			this._openSubs.add(
				fromEvent<MouseEvent>(panelEl, 'click')
					.pipe(take(1), takeUntilDestroyed(this._destroyRef))
					.subscribe(() => this.close())
			);
		}

		// The panel is body-level, so the pointer entering it is a leave as far as the
		// trigger is concerned. Tracked here so that reaching the panel keeps the dropdown
		// open, and only leaving the panel too starts the countdown again.
		if (this.trigger() === 'hover' && panelEl) {
			this._panelHover = new Subscription();
			this._panelHover.add(fromEvent(panelEl, 'mouseenter').subscribe(() => this._cancelScheduledClose()));
			this._panelHover.add(fromEvent(panelEl, 'mouseleave').subscribe(() => this._scheduleHoverClose()));
		}

		this.isOpen.set(true);
		this.opened.emit();

		// Nothing is registered for scroll here. Closing was how the panel used to stay aligned
		// with its trigger, from before the overlay could follow one: it now re-applies the
		// position strategy on scroll, on resize and whenever the trigger's own box moves, so
		// the panel keeps up — and re-decides, each time, whether it still fits where it is.

		// Click-outside detection (document-level). The overlay is mounted without a backdrop
		// — nothing dims or blocks the page behind an open menu — so this listener is the only
		// thing that closes it on an outside click. The panel has to be named explicitly:
		// it hangs off the body, never inside the trigger, so without this every click on
		// a menu item would read as a click outside and close the dropdown — whatever
		// `closeOnSelect` says.
		this._openSubs.add(
			fromEvent<MouseEvent>(this._document, 'click')
				.pipe(
					filter(
						(e) =>
							!this._el.nativeElement.contains(e.target as Node) &&
							!panelEl?.contains(e.target as Node) &&
							!!this._overlayRef?.hasAttached()
					),
					take(1),
					takeUntilDestroyed(this._destroyRef)
				)
				.subscribe(() => this.close())
		);
	}

	/** Close the dropdown and destroy the overlay. */
	close(): void {
		// Before the guard: a pending hover countdown outlives whatever closed the dropdown
		// first (Escape, a call from code), and would otherwise fire into the next
		// open one.
		this._stopHoverTracking();

		// Same reason: these hold the panel that is about to be detached.
		this._openSubs?.unsubscribe();
		this._openSubs = null;

		if (!this.isOpen()) return;
		if (openDropdown === this) {
			// Cleared before the overlay goes, so a listener that closes on the way out
			// cannot find this one still recorded as the open one.
			openDropdown = null;
		}
		this._overlayRef?.detach();
		this._overlayRef?.dispose();
		this._overlayRef = null;
		this.isOpen.set(false);
		this.closed.emit();
	}

	/** Toggle between open and closed. */
	toggle(): void {
		this.isOpen() ? this.close() : this.open();
	}

	protected _onHostClick(): void {
		if (this.trigger() === 'click') this.toggle();
	}

	protected _onHostEnter(): void {
		if (this.trigger() !== 'hover') return;

		this._cancelScheduledClose();
		this.open();
	}

	/**
	 * Leaving the trigger only starts a countdown. Closing here and now would make the
	 * panel unreachable: it is body-level and offset from the trigger, so the pointer has
	 * to cross a gap that belongs to neither of them.
	 */
	protected _onHostLeave(): void {
		if (this.trigger() !== 'hover') return;

		this._scheduleHoverClose();
	}

	/** Arms the grace period, replacing any countdown already running. */
	private _scheduleHoverClose(): void {
		this._cancelScheduledClose();

		this._hoverCloseTimer = setTimeout(() => {
			this._hoverCloseTimer = null;
			this.close();
		}, HubDropdownDirective.HOVER_GRACE_MS);
	}

	/** Disarms the grace period, because the pointer arrived somewhere that counts as inside. */
	private _cancelScheduledClose(): void {
		if (this._hoverCloseTimer === null) return;

		clearTimeout(this._hoverCloseTimer);
		this._hoverCloseTimer = null;
	}

	/** Drops both halves of the hover bookkeeping: the countdown and the panel listeners. */
	private _stopHoverTracking(): void {
		this._cancelScheduledClose();
		this._panelHover?.unsubscribe();
		this._panelHover = null;
	}
}
