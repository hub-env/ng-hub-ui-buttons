import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { OverlayRef } from 'ng-hub-ui-utils';
import { HubDropdownDirective } from './dropdown.directive';

@Component({
	standalone: true,
	imports: [HubDropdownDirective],
	template: `
		<button [hubDropdown]="tpl" #trigger="hubDropdown">Open</button>
		<ng-template #tpl><div class="panel">Panel content</div></ng-template>
	`
})
class TestHostComponent {}

describe('HubDropdownDirective', () => {
	let fixture: ComponentFixture<TestHostComponent>;
	let directive: HubDropdownDirective;

	beforeEach(async () => {
		await TestBed.configureTestingModule({ imports: [TestHostComponent] }).compileComponents();
		fixture = TestBed.createComponent(TestHostComponent);
		fixture.detectChanges();
		directive = fixture.debugElement.query(By.directive(HubDropdownDirective)).injector.get(HubDropdownDirective);
	});

	it('should create the directive', () => {
		expect(directive).toBeTruthy();
	});

	it('should be closed by default', () => {
		expect(directive.isOpen()).toBe(false);
	});

	it('should open on open()', () => {
		directive.open();
		expect(directive.isOpen()).toBe(true);
	});

	it('should close on close()', () => {
		directive.open();
		directive.close();
		expect(directive.isOpen()).toBe(false);
	});

	it('should toggle on toggle()', () => {
		directive.toggle();
		expect(directive.isOpen()).toBe(true);
		directive.toggle();
		expect(directive.isOpen()).toBe(false);
	});

	it('should emit opened output when opened', () => {
		const spy = vi.fn();
		directive.opened.subscribe(spy);
		directive.open();
		expect(spy).toHaveBeenCalledTimes(1);
	});

	/**
	 * The panel closes on Escape or an outside click — never on a backdrop, because
	 * there is none. The overlay is created without `hasBackdrop`, so nothing dims or blocks
	 * the page behind an open menu. Pinned here because the READMEs and the documentation site
	 * promised a backdrop close for eleven versions while the directive registered a handler
	 * the overlay could never call: with no backdrop element there is no backdrop click.
	 */
	describe('backdrop', () => {
		it('should mount no backdrop element while open', () => {
			directive.open();

			expect(document.querySelector('.hub-overlay-backdrop')).toBeNull();

			directive.close();
		});

		it('should register no backdrop-click handler', () => {
			const onBackdropClick = vi.spyOn(OverlayRef.prototype, 'onBackdropClick');

			directive.open();

			expect(onBackdropClick).not.toHaveBeenCalled();

			directive.close();
			onBackdropClick.mockRestore();
		});
	});
});
