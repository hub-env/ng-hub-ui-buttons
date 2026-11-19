import { Component, ComponentRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { compileString, compile } from 'sass';

import { HubButtonComponent } from './button.component';
import { HubDropdownPanelComponent } from '../dropdown-panel/dropdown-panel.component';

/**
 * Under the ds glass layer a button takes the layer's values by carrying `hub-glass-surface`, and
 * the stylesheet decides what each appearance does with them. jsdom resolves neither custom
 * properties nor `color-mix()`, so the class is read off the element and the rules off the compiled
 * stylesheet.
 */
describe('button glass layer', () => {
	const sheet = compile('projects/buttons/src/lib/components/btn/button.component.scss').css;

	/** The body of a rule, by its exact selector (or selector list). */
	function ruleBody(selector: string): string {
		const start = sheet.indexOf(`${selector} {`);
		expect(start, `rule ${selector}`).toBeGreaterThan(-1);
		return sheet.slice(start, sheet.indexOf('}', start));
	}

	describe('host class', () => {
		function host(variant: string): HTMLElement {
			const fixture = TestBed.createComponent(HubButtonComponent);
			(fixture.componentRef as ComponentRef<HubButtonComponent>).setInput('variant', variant);
			fixture.detectChanges();
			return fixture.nativeElement;
		}

		it.each(['solid', 'outline', 'soft', 'ghost'])('marks a %s button as a glass surface', (variant) => {
			expect(host(variant).classList).toContain('hub-glass-surface');
		});

		it('leaves a link button out of the layer', () => {
			expect(host('link').classList).not.toContain('hub-glass-surface');
		});

		it('marks the dropdown panel as a glass surface and keeps its colour class', () => {
			const fixture = TestBed.createComponent(HubDropdownPanelComponent);
			fixture.componentRef.setInput('color', 'danger');
			fixture.detectChanges();

			expect(fixture.nativeElement.classList).toContain('hub-glass-surface');
			expect(fixture.nativeElement.classList).toContain('hub-dropdown-panel-danger');
		});
	});

	describe('appearances', () => {
		it('turns outline, soft and ghost translucent, and not solid', () => {
			const body = ruleBody(':host(.hub-btn-outline),\n:host(.hub-btn-soft),\n:host(.hub-btn-ghost)');
			expect(body).toContain('--hub-btn-glass-opacity: var(--hub-sys-glass-opacity, 100%)');
			expect(sheet).not.toMatch(/:host\(\.hub-btn-solid\)[^{]*\{[^}]*\s--hub-btn-glass-opacity:/);
		});

		it('gives outline a frosted veil at rest', () => {
			expect(ruleBody(':host(.hub-btn-outline)')).toContain('var(--hub-sys-glass-veil, transparent)');
		});

		it('keeps the rim out of the focus ring, which is a box-shadow too', () => {
			const body = ruleBody(
				':host(.hub-btn-solid:not(:focus-visible)),\n:host(.hub-btn-outline:not(:focus-visible)),\n:host(.hub-btn-soft:not(:focus-visible))'
			);
			expect(body).toContain('box-shadow: var(--hub-sys-glass-rim, none)');
			expect(sheet).not.toMatch(/:host\(\.hub-btn-link[^)]*\)[^{]*\{[^}]*glass-rim/);
		});

		it('draws the gloss and sheen on ghost only while hovered', () => {
			expect(ruleBody(':host(.hub-btn-ghost:hover)')).toContain('var(--hub-sys-glass-gloss, none)');
			expect(ruleBody(':host(.hub-btn-solid),\n:host(.hub-btn-outline),\n:host(.hub-btn-soft)')).toContain(
				'var(--hub-sys-glass-sheen, none)'
			);
		});
	});

	describe('hub-btn-variant-rules mixin', () => {
		const css = compileString(`@use 'btn-mixins' as m; .x { @include m.hub-btn-variant-rules($bg: red); }`, {
			loadPaths: ['projects/buttons/src/lib/styles']
		}).css;

		it('fills through the opacity variable, opaque when it is unset', () => {
			expect(css).toContain('background-color: color-mix(in srgb, red var(--hub-btn-glass-opacity, 100%), transparent)');
		});

		it('does the same for the hover and active fills', () => {
			expect(css).toContain(
				'color-mix(in srgb, var(--hub-btn-hover-bg) var(--hub-btn-glass-opacity, 100%), transparent)'
			);
			expect(css).toContain(
				'color-mix(in srgb, var(--hub-btn-active-bg) var(--hub-btn-glass-opacity, 100%), transparent)'
			);
		});
	});
});
