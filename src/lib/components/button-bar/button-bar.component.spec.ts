import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router, RouterLink, provideRouter } from '@angular/router';
import { HubButtonComponent } from '../btn/button.component';
import { HubDropdownItemComponent } from '../dropdown-item/dropdown-item.component';
import { HubButtonBarComponent, HubButtonBarMenuDirective, HubButtonBarOptionsDirective } from './button-bar.component';

@Component({ standalone: true, template: '' })
class TargetComponent {}

@Component({
	standalone: true,
	imports: [
		HubButtonBarComponent,
		HubButtonBarMenuDirective,
		HubButtonBarOptionsDirective,
		HubButtonComponent,
		HubDropdownItemComponent,
		RouterLink
	],
	template: `
		<div style="width: 2000px">
			<hub-button-bar>
				@if (showExtra()) {
					<button hubButton variant="outline" (click)="ran.push('extra')">Extra</button>
				}
				<button hubButton variant="outline" (click)="ran.push('export')"><i class="bi bi-download"></i> Export</button>
				<button hubButton (click)="ran.push('main')">Main</button>
				<button hubButton variant="outline" color="danger" (click)="ran.push('delete')">Delete</button>
				<button hubButton variant="outline" disabled (click)="ran.push('locked')">Locked</button>
				<a hubButton variant="outline" routerLink="/target">Go</a>
				@if (withOptions()) {
					<ng-template hubButtonBarOptions>
						<hub-dropdown-item (itemClick)="ran.push('option')">Option</hub-dropdown-item>
					</ng-template>
				}
				@if (withMenu()) {
					<ng-template hubButtonBarMenu>
						<hub-dropdown-item (itemClick)="ran.push('archive')">Archive</hub-dropdown-item>
					</ng-template>
				}
			</hub-button-bar>
		</div>
	`
})
class HostComponent {
	readonly showExtra = signal(false);
	readonly withOptions = signal(true);
	readonly withMenu = signal(true);
	readonly ran: string[] = [];
}

@Component({
	standalone: true,
	imports: [HubButtonBarComponent, HubButtonBarOptionsDirective, HubButtonComponent, HubDropdownItemComponent],
	template: `
		<hub-button-bar>
			<button hubButton variant="outline">A</button>
			<button hubButton variant="ghost">B</button>
			<ng-template hubButtonBarOptions><hub-dropdown-item>Option</hub-dropdown-item></ng-template>
		</hub-button-bar>
	`
})
class NoMainHostComponent {}

describe('HubButtonBarComponent', () => {
	beforeEach(async () => {
		vi.stubGlobal(
			'ResizeObserver',
			class {
				observe() {}
				unobserve() {}
				disconnect() {}
			}
		);
		await TestBed.configureTestingModule({
			providers: [provideRouter([{ path: 'target', component: TargetComponent }])]
		}).compileComponents();
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		document.body.querySelectorAll('hub-dropdown-panel').forEach((el) => el.remove());
	});

	/** Texts of the projected buttons that are showing (not folded), in DOM order. */
	const visible = (root: HTMLElement) =>
		Array.from(root.querySelectorAll<HTMLElement>('[data-hub-button-bar-id]'))
			.filter((el) => !el.classList.contains('hub-button-bar__folded'))
			.map((el) => (el.textContent ?? '').trim());
	const more = (root: HTMLElement) => root.querySelector<HTMLElement>('[data-hub-button-bar-more]');
	const caret = (root: HTMLElement) => root.querySelector<HTMLElement>('.hub-button-bar__caret');

	async function open(fixture: ComponentFixture<unknown>, trigger: HTMLElement): Promise<HTMLElement[]> {
		trigger.click();
		fixture.detectChanges();
		await fixture.whenStable();
		fixture.detectChanges();
		return Array.from(document.body.querySelectorAll<HTMLElement>('hub-dropdown-item'));
	}
	const texts = (items: HTMLElement[]) => items.map((el) => (el.textContent ?? '').trim());

	function mount<T>(type: new () => T) {
		const fixture = TestBed.createComponent(type);
		fixture.detectChanges();
		const bar = fixture.debugElement.query(By.directive(HubButtonBarComponent)).componentInstance as any;
		const fold = () => {
			bar.narrow.set(true);
			fixture.detectChanges();
		};
		return { fixture, root: fixture.nativeElement as HTMLElement, fold, host: fixture.componentInstance };
	}

	describe('wide', () => {
		it('shows every button as written, with no change to its variant or colour', () => {
			const { root } = mount(HostComponent);

			expect(visible(root)).toEqual(['Export', 'Main', 'Delete', 'Locked', 'Go']);
			const del = Array.from(root.querySelectorAll<HTMLElement>('[data-hub-button-bar-id]')).find((el) =>
				el.textContent?.includes('Delete')
			)!;
			expect(del.className).toContain('danger');
		});

		it('joins a caret to the first solid button when options are given, and places it right after it', () => {
			const { root } = mount(HostComponent);
			const main = Array.from(root.querySelectorAll<HTMLElement>('[data-hub-button-bar-id]')).find(
				(el) => el.textContent?.trim() === 'Main'
			)!;

			expect(caret(root)).not.toBeNull();
			expect(main.classList).toContain('hub-button-bar__split-main');
			expect(Number(caret(root)!.style.order)).toBe(Number(main.style.order) + 1);
		});

		it('opens the options from the caret', async () => {
			const { fixture, root } = mount(HostComponent);

			expect(texts(await open(fixture, caret(root)!))).toEqual(['Option']);
		});

		it('draws no caret without options and no menu trigger when nothing belongs in it', () => {
			const { fixture, root, host } = mount(HostComponent);
			host.withOptions.set(false);
			host.withMenu.set(false);
			fixture.detectChanges();

			expect(caret(root)).toBeNull();
			expect(more(root)).toBeNull();
		});

		it('lists only the menu template in the menu', async () => {
			const { fixture, root } = mount(HostComponent);

			expect(texts(await open(fixture, more(root)!))).toEqual(['Archive']);
		});
	});

	describe('folded', () => {
		it('keeps only the main button and lists options, folded buttons and the menu, in that order', async () => {
			const { fixture, root, fold } = mount(HostComponent);
			fold();

			expect(visible(root)).toEqual(['Main']);
			expect(caret(root)).toBeNull();
			expect(texts(await open(fixture, more(root)!))).toEqual(['Option', 'Export', 'Delete', 'Locked', 'Go', 'Archive']);
		});

		it("takes each entry's icon and colour from its button", async () => {
			const { fixture, root, fold } = mount(HostComponent);
			fold();
			const items = await open(fixture, more(root)!);
			const entry = (text: string) => items.find((el) => el.textContent?.trim() === text)!;

			expect(entry('Export').querySelector('i')?.className).toContain('bi-download');
			expect(entry('Delete').className).toContain('danger');
		});

		it("runs the button's own click handler from its entry", async () => {
			const { fixture, root, fold, host } = mount(HostComponent);
			fold();
			const items = await open(fixture, more(root)!);
			items
				.find((el) => el.textContent?.trim() === 'Export')!
				.querySelector<HTMLElement>('button, [role="menuitem"]')!
				.click();

			expect(host.ran).toEqual(['export']);
		});

		it('keeps a disabled button inert from the menu', async () => {
			const { fixture, root, fold, host } = mount(HostComponent);
			fold();
			const items = await open(fixture, more(root)!);
			const locked = items.find((el) => el.textContent?.trim() === 'Locked')!;
			locked.querySelector<HTMLElement>('button, [role="menuitem"]')?.click();

			expect(host.ran).toEqual([]);
		});

		it("follows a folded routerLink through the button's own link", async () => {
			const { fixture, root, fold } = mount(HostComponent);
			fold();
			const items = await open(fixture, more(root)!);
			items
				.find((el) => el.textContent?.trim() === 'Go')!
				.querySelector<HTMLElement>('button, [role="menuitem"]')!
				.click();
			await fixture.whenStable();

			expect(TestBed.inject(Router).url).toBe('/target');
		});

		it('survives the FLIP path when the Web Animations API is missing', () => {
			const original = Element.prototype.animate;
			(Element.prototype as any).animate = undefined;
			try {
				const { root, fold } = mount(HostComponent);
				fold();

				expect(visible(root)).toEqual(['Main']);
			} finally {
				Element.prototype.animate = original;
			}
		});
	});

	it('adds and removes a button when its @if toggles', () => {
		const { fixture, root, host } = mount(HostComponent);
		host.showExtra.set(true);
		fixture.detectChanges();

		expect(visible(root)[0]).toBe('Extra');

		host.showExtra.set(false);
		fixture.detectChanges();

		expect(visible(root)).not.toContain('Extra');
	});

	it('folds every button, options included, when none is solid', async () => {
		const { fixture, root, fold } = mount(NoMainHostComponent);

		expect(caret(root)).toBeNull();
		fold();

		expect(visible(root)).toEqual([]);
		expect(texts(await open(fixture, more(root)!))).toEqual(['Option', 'A', 'B']);
	});
});

/**
 * Measuring and motion. jsdom has no layout, so the widths the bar reads are pinned on the
 * elements, the ResizeObserver callback is captured to be fired by hand, and `animate` /
 * `matchMedia` are stubbed so the animated path is reachable.
 */
describe('HubButtonBarComponent measuring', () => {
	let resize: (() => void) | undefined;
	let observers: number;
	let animate: ReturnType<typeof vi.fn>;
	const originalAnimate = Element.prototype.animate;

	beforeEach(async () => {
		resize = undefined;
		observers = 0;
		vi.stubGlobal(
			'ResizeObserver',
			class {
				constructor(callback: () => void) {
					resize = callback;
					observers++;
				}
				observe() {}
				unobserve() {}
				disconnect() {}
			}
		);
		vi.stubGlobal('matchMedia', () => ({ matches: false }));
		animate = vi.fn(() => ({ cancel: vi.fn(), onfinish: null }));
		(Element.prototype as any).animate = animate;
		await TestBed.configureTestingModule({ providers: [provideRouter([])] }).compileComponents();
	});

	afterEach(() => {
		Element.prototype.animate = originalAnimate;
		vi.unstubAllGlobals();
	});

	/** Mounts the host and pins the row width and the group's natural width to the given values. */
	function mountSized(row: number, group: number) {
		const fixture = TestBed.createComponent(HostComponent);
		fixture.detectChanges();
		const root = fixture.nativeElement as HTMLElement;
		const size = { row, group };
		const bar = root.querySelector<HTMLElement>('hub-button-bar')!;
		Object.defineProperty(bar.parentElement!, 'clientWidth', { get: () => size.row });
		Object.defineProperty(bar.querySelector('.hub-button-bar__group')!, 'offsetWidth', { get: () => size.group });
		return { fixture, root, size, host: fixture.componentInstance };
	}

	const shown = (root: HTMLElement) =>
		Array.from(root.querySelectorAll<HTMLElement>('[data-hub-button-bar-id]'))
			.filter((el) => !el.classList.contains('hub-button-bar__folded'))
			.map((el) => (el.textContent ?? '').trim());

	it('creates the ResizeObserver only once rendered, so server rendering never meets it', () => {
		const fixture = TestBed.createComponent(HostComponent);

		expect(observers).toBe(0);

		fixture.detectChanges();
		TestBed.tick();

		expect(observers).toBe(1);
	});

	it('folds with an animation when the row is resized below the group plus minContentWidth', () => {
		const { root, size } = mountSized(2000, 600);
		resize!();

		expect(shown(root)).toEqual(['Export', 'Main', 'Delete', 'Locked', 'Go']);

		size.row = 700;
		resize!();

		expect(shown(root)).toEqual(['Main']);
		expect(animate).toHaveBeenCalled();
	});

	it('settles a change to the buttons while folded before paint, without replaying the fold', () => {
		const { fixture, root, size, host } = mountSized(2000, 600);
		resize!();
		size.row = 700;
		resize!();
		animate.mockClear();

		host.showExtra.set(true);
		fixture.detectChanges();
		TestBed.tick();

		expect(shown(root)).toEqual(['Main']);
		expect(animate).not.toHaveBeenCalled();
	});

	it('unfolds once the row can hold the whole group again', () => {
		const { root, size } = mountSized(700, 600);
		resize!();

		expect(shown(root)).toEqual(['Main']);

		size.row = 2000;
		resize!();

		expect(shown(root)).toEqual(['Export', 'Main', 'Delete', 'Locked', 'Go']);
	});
});
