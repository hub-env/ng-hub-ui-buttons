import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { HubDropdownDirective } from './dropdown.directive';

/**
 * `closeOnSelect="false"` is what a multi-select menu, a filter panel or a form inside a
 * dropdown is built on: the user picks several things before the panel goes away.
 *
 * The panel is rendered on the body, so it is not a descendant of its trigger. The
 * click-outside listener only ever excluded the trigger, which made every click on a menu
 * item a click outside — and closed the dropdown no matter what the input said.
 */
@Component({
	standalone: true,
	imports: [HubDropdownDirective],
	template: `
		<button class="loose-trigger" [hubDropdown]="loose" [closeOnSelect]="false">Stay</button>
		<ng-template #loose>
			<div class="loose-panel">
				<button class="item" type="button" (click)="picked = picked + 1">Item</button>
			</div>
		</ng-template>

		<button class="strict-trigger" [hubDropdown]="strict">Close</button>
		<ng-template #strict>
			<div class="strict-panel">
				<button class="item" type="button">Item</button>
			</div>
		</ng-template>
	`
})
class Menus {
	picked = 0;
}

describe('dropdown closeOnSelect', () => {
	let fixture: ComponentFixture<Menus>;
	let loose: HubDropdownDirective;
	let strict: HubDropdownDirective;

	const itemIn = (panel: string) => document.querySelector<HTMLElement>(`.${panel} .item`)!;

	beforeEach(async () => {
		await TestBed.configureTestingModule({ imports: [Menus] }).compileComponents();

		fixture = TestBed.createComponent(Menus);
		fixture.detectChanges();

		[loose, strict] = fixture.debugElement
			.queryAll(By.directive(HubDropdownDirective))
			.map((de) => de.injector.get(HubDropdownDirective));
	});

	afterEach(() => {
		loose.close();
		strict.close();
	});

	it('keeps the panel open when a click lands inside it', () => {
		loose.open();
		fixture.detectChanges();

		itemIn('loose-panel').click();

		expect(fixture.componentInstance.picked).toBe(1);
		expect(loose.isOpen()).toBe(true);
	});

	it('survives several picks in a row', () => {
		loose.open();
		fixture.detectChanges();

		itemIn('loose-panel').click();
		itemIn('loose-panel').click();
		itemIn('loose-panel').click();

		expect(fixture.componentInstance.picked).toBe(3);
		expect(loose.isOpen()).toBe(true);
	});

	it('still closes on a click that is genuinely outside', () => {
		loose.open();
		fixture.detectChanges();

		document.body.click();

		expect(loose.isOpen()).toBe(false);
	});

	it('closes on a click inside the panel when closeOnSelect is left on', () => {
		strict.open();
		fixture.detectChanges();

		itemIn('strict-panel').click();

		expect(strict.isOpen()).toBe(false);
	});

	/**
	 * The listeners open() installs are retired by `take(1)`, which only fires on a click that
	 * is genuinely outside. Closing any other way — Escape, a call from code — used to
	 * leave them subscribed, still holding the panel that had just been detached. On the next
	 * open, a click inside the NEW panel is not inside the OLD one, so the filter let it through
	 * and closed the dropdown: `closeOnSelect: false` held for one cycle and no more.
	 */
	it('keeps honouring closeOnSelect after being closed from code and reopened', () => {
		loose.open();
		fixture.detectChanges();
		loose.close();

		loose.open();
		fixture.detectChanges();

		itemIn('loose-panel').click();

		expect(fixture.componentInstance.picked).toBe(1);
		expect(loose.isOpen()).toBe(true);
	});

	it('still closes on a genuine outside click after a reopen', () => {
		loose.open();
		fixture.detectChanges();
		loose.close();

		loose.open();
		fixture.detectChanges();

		document.body.click();

		expect(loose.isOpen()).toBe(false);
	});
});
