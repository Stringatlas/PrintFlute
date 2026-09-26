import { describe, expect, it } from 'vitest';
import { createDesignDraft } from '$lib/api/generation/__fixtures__/design';
import type { FluteParameters, ToneHoleParameters } from '$lib/api/generation/contracts';
import { PARAMETER_BOUNDS } from '$lib/validation/designParameters';
import {
	DESIGN_FIELDS,
	FLUTE_FIELDS,
	TONE_HOLE_FIELDS,
	isFieldVisible,
	toneHoleParameterPath
} from './designSchema';

describe('design parameter schema', () => {
	it('covers every flute field and tone-hole array', () => {
		const fluteKeys = Object.keys(createDesignDraft().flute) as (keyof FluteParameters)[];
		const toneHoleKeys = Object.keys(createDesignDraft().toneHoles) as (keyof ToneHoleParameters)[];

		expect(Object.keys(FLUTE_FIELDS).sort()).toEqual(fluteKeys.sort());
		expect(Object.keys(TONE_HOLE_FIELDS).sort()).toEqual(toneHoleKeys.sort());
		expect(DESIGN_FIELDS).toHaveLength(fluteKeys.length + toneHoleKeys.length);
	});

	it('references canonical bounds instead of copying them', () => {
		expect(FLUTE_FIELDS.boreDiameter.bounds).toBe(PARAMETER_BOUNDS.boreDiameter);
		expect(FLUTE_FIELDS.numberOfCuts.bounds).toBe(PARAMETER_BOUNDS.numberOfCuts);
		expect(FLUTE_FIELDS.cutDistances.bounds).toBe(PARAMETER_BOUNDS.cutDistance);
		expect(TONE_HOLE_FIELDS.holeDiameters.bounds).toBe(PARAMETER_BOUNDS.holeDiameter);
		expect(TONE_HOLE_FIELDS.holeCents.bounds).toBe(PARAMETER_BOUNDS.holeCents);
	});

	it('provides contract paths and declared dependency paths', () => {
		expect(toneHoleParameterPath('holeDiameters', 2)).toBe('toneHoles.holeDiameters.2');
		for (const schema of DESIGN_FIELDS) {
			expect(schema.path).toMatch(/^(flute|toneHoles)\./);
			for (const dependency of schema.dependencies) {
				expect(dependency).toMatch(/^(flute|toneHoles)\./);
			}
		}
	});

	it('applies view and design-dependent visibility', () => {
		const design = createDesignDraft();
		expect(isFieldVisible(FLUTE_FIELDS.overhangLength, design, 'basic')).toBe(false);
		expect(isFieldVisible(FLUTE_FIELDS.overhangLength, design, 'advanced')).toBe(true);

		design.flute.hasThumbHole = false;
		expect(isFieldVisible(FLUTE_FIELDS.thumbHoleDiameter, design, 'basic')).toBe(false);
		design.flute.hasThumbHole = true;
		expect(isFieldVisible(FLUTE_FIELDS.thumbHoleDiameter, design, 'basic')).toBe(true);
	});

	it('marks acoustic outputs read-only and derived', () => {
		const derived = [
			FLUTE_FIELDS.embouchureDistance,
			FLUTE_FIELDS.fluteLength,
			TONE_HOLE_FIELDS.holeDistances,
			TONE_HOLE_FIELDS.cutoffRatios
		];

		for (const schema of derived) {
			expect(schema.readOnly).toBe(true);
			expect(schema.derived).toBe(true);
			expect(schema.input).toBe('display');
			expect(schema.defaultSource.kind).toBe('acoustic-calculation');
			expect(schema.dependencies.length).toBeGreaterThan(0);
		}
	});
});
