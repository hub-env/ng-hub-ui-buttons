import type { ConnectionPosition, HorizontalConnectionPos, VerticalConnectionPos } from 'ng-hub-ui-utils';
import { HubDropdownPlacement } from '../models/button.types';

/**
 * Turns a placement into the chain of candidates the overlay strategy walks.
 *
 * The strategy already picks the first candidate that fits and keeps the first one when none
 * does, so flipping is nothing but giving it somewhere else to go: what the consumer asked for
 * leads the chain and is therefore still used whenever it fits, and the rest are the same panel
 * reflected across the edge it would have overflowed. Handing it a single candidate — which is
 * what this did until TD-280 — turns "the first that fits" into "the only one", and a menu on
 * the last row of a table is drawn below the fold rather than above its trigger.
 *
 * Both axes flip, because both overflow: the block axis swaps `bottom` for `top`, the inline
 * axis swaps `end` for `start`. They are named logically and stay that way down to the strategy,
 * which resolves them against the origin's own writing direction — so an RTL menu flips towards
 * the edge it actually has room on, with no second table here.
 *
 * Block flips are tried before inline ones: a dropdown that ran out of room below has usually
 * run out of room below only, and moving it sideways as well would shift a panel the reader was
 * already looking at.
 */
export function hubDropdownPositions(placement: HubDropdownPlacement, offset: number): ConnectionPosition[] {
	if (placement === 'start' || placement === 'end') {
		return inlinePositions(placement, offset);
	}

	const [side, align = 'center'] = placement.split('-') as ['top' | 'bottom', HorizontalConnectionPos | undefined];

	return blockPositions(side, align, offset);
}

/**
 * Candidates for a panel that hangs above or below its trigger.
 *
 * A centred panel has no alignment to mirror, so both edges are offered instead and the strategy
 * takes whichever one brings it back inside — which edge that is depends on where the trigger sits.
 */
function blockPositions(side: 'top' | 'bottom', align: HorizontalConnectionPos, offset: number): ConnectionPosition[] {
	const sides: ('top' | 'bottom')[] = [side, opposite(side)];
	const aligns: HorizontalConnectionPos[] = align === 'center' ? ['center', 'start', 'end'] : [align, opposite(align)];

	return aligns.flatMap((overlayAlign) =>
		sides.map((originSide) => ({
			originX: overlayAlign,
			originY: originSide,
			overlayX: overlayAlign,
			overlayY: opposite(originSide),
			offsetY: originSide === 'bottom' ? offset : -offset
		}))
	);
}

/**
 * Candidates for a panel that sits beside its trigger.
 *
 * The inline flip is the point here, so it comes first. The vertical fallbacks pin the panel to
 * the trigger's top or bottom edge, which is what rescues a centred side panel next to a trigger
 * close to either end of the viewport.
 */
function inlinePositions(side: 'start' | 'end', offset: number): ConnectionPosition[] {
	const sides: ('start' | 'end')[] = [side, opposite(side)];
	const aligns: VerticalConnectionPos[] = ['center', 'top', 'bottom'];

	return aligns.flatMap((overlayAlign) =>
		sides.map((originSide) => ({
			originX: originSide,
			originY: overlayAlign,
			overlayX: opposite(originSide),
			overlayY: overlayAlign,
			offsetX: originSide === 'end' ? offset : -offset
		}))
	);
}

/** The edge across from the given one, on whichever axis it names. */
function opposite(edge: 'top' | 'bottom'): 'top' | 'bottom';
function opposite(edge: 'start' | 'end'): 'start' | 'end';
function opposite(edge: 'top' | 'bottom' | 'start' | 'end'): 'top' | 'bottom' | 'start' | 'end' {
	switch (edge) {
		case 'top':
			return 'bottom';
		case 'bottom':
			return 'top';
		case 'start':
			return 'end';
		case 'end':
			return 'start';
	}
}
