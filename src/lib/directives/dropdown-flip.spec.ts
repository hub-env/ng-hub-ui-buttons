import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { HubDropdownDirective } from './dropdown.directive';
import { HubDropdownPlacement } from '../models/button.types';

/**
 * The viewport every case in this file is measured against. Small on purpose: a trigger near
 * `600` is a trigger on the last row of a table, which is where TD-280 was reported.
 */
const VIEWPORT = { width: 1000, height: 600 };

/** What the panel measures once mounted. jsdom lays nothing out, so it has to be told. */
const PANEL = { width: 180, height: 200 };

/** The trigger's box, rewritten per case and re-read on every measurement the strategy takes. */
let triggerBox = { top: 100, left: 400, width: 100, height: 30 };

function domRect(box: { top: number; left: number; width: number; height: number }): DOMRect {
	const value = {
		...box,
		right: box.left + box.width,
		bottom: box.top + box.height,
		x: box.left,
		y: box.top
	};

	return { ...value, toJSON: () => value } as DOMRect;
}

@Component({
	standalone: true,
	imports: [HubDropdownDirective],
	template: `
		<button [hubDropdown]="tpl" [placement]="placement()" #trigger="hubDropdown">Open</button>
		<ng-template #tpl><div class="panel">Panel content</div></ng-template>
	`
})
class FlipHostComponent {
	/** A signal, not a field: under zoneless change detection a plain field never marks the view dirty. */
	readonly placement = signal<HubDropdownPlacement>('bottom-end');
}

/**
 * Proves the panel goes where it fits, not only where it was asked to go.
 *
 * Everything here is arithmetic on stubbed rects: jsdom performs no layout, so the trigger and
 * the overlay container are each given an explicit box and the viewport is pinned. What is under
 * test is the candidate chain the directive hands the positioner — before TD-280 it handed a
 * single one, so a panel that did not fit had nowhere to go and was placed off-screen anyway.
 */
describe('HubDropdownDirective viewport flipping', () => {
	let fixture: ComponentFixture<FlipHostComponent>;
	let directive: HubDropdownDirective;
	let trigger: HTMLElement;
	let nativeRect: typeof Element.prototype.getBoundingClientRect;
	let innerWidth: PropertyDescriptor | undefined;
	let innerHeight: PropertyDescriptor | undefined;

	/** The container the overlay positions; its inline `top`/`left` are the assertion surface. */
	function container(): HTMLElement {
		return document.querySelector('.hub-dropdown-overlay') as HTMLElement;
	}

	function openWith(placement: HubDropdownPlacement, box: typeof triggerBox, direction: 'ltr' | 'rtl' = 'ltr'): void {
		triggerBox = box;
		trigger.style.direction = direction;
		fixture.componentInstance.placement.set(placement);
		fixture.detectChanges();
		directive.open();
	}

	beforeEach(async () => {
		await TestBed.configureTestingModule({ imports: [FlipHostComponent] }).compileComponents();
		fixture = TestBed.createComponent(FlipHostComponent);
		fixture.detectChanges();
		directive = fixture.debugElement.query(By.directive(HubDropdownDirective)).injector.get(HubDropdownDirective);
		trigger = fixture.debugElement.query(By.directive(HubDropdownDirective)).nativeElement;

		innerWidth = Object.getOwnPropertyDescriptor(window, 'innerWidth');
		innerHeight = Object.getOwnPropertyDescriptor(window, 'innerHeight');
		Object.defineProperty(window, 'innerWidth', { value: VIEWPORT.width, configurable: true });
		Object.defineProperty(window, 'innerHeight', { value: VIEWPORT.height, configurable: true });

		nativeRect = Element.prototype.getBoundingClientRect;
		Element.prototype.getBoundingClientRect = function (this: Element): DOMRect {
			if (this.classList.contains('hub-overlay-container')) {
				return domRect({ top: 0, left: 0, ...PANEL });
			}
			if (this === trigger) {
				return domRect(triggerBox);
			}
			return nativeRect.call(this);
		};
	});

	afterEach(() => {
		directive.close();
		Element.prototype.getBoundingClientRect = nativeRect;
		if (innerWidth) Object.defineProperty(window, 'innerWidth', innerWidth);
		if (innerHeight) Object.defineProperty(window, 'innerHeight', innerHeight);
	});

	it('flips a bottom placement above the trigger when the panel would fall off the bottom edge', () => {
		// Trigger bottom at 570 of a 600px viewport: below it there is room for 26px, not 200.
		openWith('bottom-end', { top: 540, left: 400, width: 100, height: 30 });

		// Above: the panel's bottom edge lands on the trigger's top edge (540 - 200), less the offset.
		expect(container().style.top).toBe('336px');
		// The inline edge is untouched — only the axis that overflowed flipped.
		expect(container().style.left).toBe('320px');
	});

	it('keeps the asked-for placement when it fits', () => {
		openWith('bottom-end', { top: 100, left: 400, width: 100, height: 30 });

		// Below the trigger (130) plus the 4px offset. A panel that flips when it need not is its own bug.
		expect(container().style.top).toBe('134px');
		expect(container().style.left).toBe('320px');
	});

	it('flips an end-aligned panel to the start edge when it would fall off the inline edge', () => {
		// Trigger 10px from the left edge: end-aligning a 180px panel to its right edge lands at -70.
		openWith('bottom-end', { top: 100, left: 10, width: 100, height: 30 });

		expect(container().style.left).toBe('10px');
		expect(container().style.top).toBe('134px');
	});

	it('flips on the logical inline edge, so RTL flips the other way', () => {
		// Under RTL `end` is the left edge and the panel grows rightward: 900 + 180 overflows 1000.
		openWith('bottom-end', { top: 100, left: 900, width: 90, height: 30 }, 'rtl');

		// `start` under RTL is the trigger's right edge, with the panel hanging leftward: 990 - 180.
		expect(container().style.left).toBe('810px');
	});

	it('flips a top placement below the trigger when there is no room above', () => {
		openWith('top-start', { top: 20, left: 400, width: 100, height: 30 });

		// Above it would sit at -184. Below the trigger's bottom edge (50) plus the offset.
		expect(container().style.top).toBe('54px');
	});

	/**
	 * A scroll used to close the dropdown, which is how the panel stayed glued to its trigger
	 * before the overlay could follow it. It can: the overlay re-applies the strategy on scroll
	 * and resize, so the panel now re-anchors — and re-decides whether it still fits where it is.
	 */
	it('re-anchors instead of closing when the page scrolls under an open panel', async () => {
		openWith('bottom-end', { top: 100, left: 400, width: 100, height: 30 });
		expect(container().style.top).toBe('134px');

		triggerBox = { top: 540, left: 400, width: 100, height: 30 };
		window.dispatchEvent(new Event('scroll'));
		await nextFrames();

		expect(directive.isOpen()).toBe(true);
		expect(container().style.top).toBe('336px');
	});

	it('re-anchors when the window is resized under an open panel', async () => {
		// Trigger bottom at 370: 370 + 4 + 200 still clears a 600px viewport, so it opens below.
		openWith('bottom-end', { top: 340, left: 400, width: 100, height: 30 });
		expect(container().style.top).toBe('374px');

		Object.defineProperty(window, 'innerHeight', { value: 500, configurable: true });
		window.dispatchEvent(new Event('resize'));
		await nextFrames();

		expect(directive.isOpen()).toBe(true);
		// 574 overflows the shortened viewport, so the panel moves above the trigger: 340 - 200 - 4.
		expect(container().style.top).toBe('136px');
	});
});

/** Lets the overlay's frame-coalesced reposition run before the assertions read the DOM. */
function nextFrames(): Promise<void> {
	return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
}
