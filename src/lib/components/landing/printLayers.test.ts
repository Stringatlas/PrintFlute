import { describe, expect, it } from 'vitest';
import { buildPrintLayers, createFluteProfile, PRINT_VIEW } from './printLayers';

describe('flat print animation layers', () => {
	it('builds from the print bed upward', () => {
		const layers = buildPrintLayers({ boreDiameter: 14.3, wallThickness: 2.5, holeCount: 6 });
		expect(layers.length).toBeGreaterThan(40);
		expect(layers[0].y).toBeLessThan(PRINT_VIEW.bedY);
		expect(layers[0].y).toBeGreaterThan(layers.at(-1)!.y);
	});

	it('uses a long horizontal profile', () => {
		const profile = createFluteProfile({});
		const width = profile.xFoot - profile.xHead;
		expect(width).toBeGreaterThan(profile.outerRadius * 8);
	});

	it('opens the embouchure at its widest point on the top surface', () => {
		const profile = createFluteProfile({});
		expect(profile.embouchure.y).toBe(profile.centerY - profile.outerRadius);
	});

	it('keeps the embouchure visually separate from the tone holes', () => {
		const profile = createFluteProfile({ holeCount: 6 });
		const embouchureRightEdge = profile.embouchure.x + profile.embouchure.rx;
		const firstToneHoleLeftEdge = profile.holes[0].x - profile.holes[0].r;
		expect(firstToneHoleLeftEdge - embouchureRightEdge).toBeGreaterThan(100);
	});
});
