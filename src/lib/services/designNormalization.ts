import type {
	ComputedParameter,
	DesignDraft,
	FluteParameters,
	ToneHoleParameters
} from '$lib/domain/fluteTypes';
import { MAX_TONE_HOLES, PARAMETER_BOUNDS } from '$lib/validation/designParameters';
import { calculateRecommendedHoleDistances } from '$lib/services/fluteCalculation';

export const DEFAULT_FLUTE_PARAMETERS: FluteParameters = {
	boreDiameter: 14.3,
	wallThickness: 2.5,
	hasThumbHole: true,
	thumbHoleDiameter: 6,
	thumbHoleAngle: 0,
	overhangLength: 20,
	corkDistance: { mode: 'auto' },
	corkThickness: { mode: 'auto' },
	embouchureHoleLength: 9.5,
	embouchureHoleWidth: 9.5,
	lipCoveragePercent: 5,
	embouchureDistance: 0,
	fluteLength: 0,
	numberOfToneHoles: 6,
	fundamentalFrequency: 587.33,
	toneHoleFilletRadius: 1.5,
	connectorLength: 15,
	numberOfCuts: 1,
	cutDistances: [180]
};

const DEFAULT_TONE_HOLE_SEED: ToneHoleParameters = {
	holeDiameters: [7.5, 8, 5, 6, 6.5, 5.5, 6, 6],
	holeDistances: Array(MAX_TONE_HOLES).fill(0),
	holeAngles: Array(MAX_TONE_HOLES).fill(0),
	holeCents: [200, 400, 500, 700, 900, 1100, 1200, 1400],
	cutoffRatios: Array(MAX_TONE_HOLES).fill(0)
};

function defaultRecommendedHoleDistances(): number[] {
	try {
		return calculateRecommendedHoleDistances(
			DEFAULT_FLUTE_PARAMETERS,
			DEFAULT_TONE_HOLE_SEED
		);
	} catch {
		// Keep startup resilient if future default acoustic inputs are temporarily invalid.
		return [256, 221, 201, 166, 129, 93, 70, 50];
	}
}

export const DEFAULT_TONE_HOLE_PARAMETERS: ToneHoleParameters = {
	...DEFAULT_TONE_HOLE_SEED,
	holeDistances: defaultRecommendedHoleDistances()
};

function clamp(
	value: unknown,
	fallback: number,
	bounds: { min: number; max: number },
	integer = false
): number {
	const number = typeof value === 'number' && Number.isFinite(value) ? value : fallback;
	const bounded = Math.min(bounds.max, Math.max(bounds.min, number));
	return integer ? Math.round(bounded) : bounded;
}

function normalizeComputed(
	value: unknown,
	fallback: ComputedParameter<number>,
	bounds: { min: number; max: number }
): ComputedParameter<number> {
	if (!value || typeof value !== 'object' || (value as { mode?: unknown }).mode !== 'manual') {
		return { mode: 'auto' };
	}
	return {
		mode: 'manual',
		value: clamp((value as { value?: unknown }).value, fallback.value ?? bounds.min, bounds)
	};
}

/** Converts untrusted persisted/imported state into complete flute inputs. */
export function normalizeFluteParameters(value: unknown): FluteParameters {
	const source = value && typeof value === 'object' ? (value as Partial<FluteParameters>) : {};
	const cuts = clamp(
		source.numberOfCuts,
		DEFAULT_FLUTE_PARAMETERS.numberOfCuts,
		PARAMETER_BOUNDS.numberOfCuts,
		true
	);
	const sourceDistances = Array.isArray(source.cutDistances)
		? source.cutDistances
		: DEFAULT_FLUTE_PARAMETERS.cutDistances;

	return {
		boreDiameter: clamp(
			source.boreDiameter,
			DEFAULT_FLUTE_PARAMETERS.boreDiameter,
			PARAMETER_BOUNDS.boreDiameter
		),
		wallThickness: clamp(
			source.wallThickness,
			DEFAULT_FLUTE_PARAMETERS.wallThickness,
			PARAMETER_BOUNDS.wallThickness
		),
		hasThumbHole:
			typeof source.hasThumbHole === 'boolean'
				? source.hasThumbHole
				: DEFAULT_FLUTE_PARAMETERS.hasThumbHole,
		thumbHoleDiameter: clamp(
			source.thumbHoleDiameter,
			DEFAULT_FLUTE_PARAMETERS.thumbHoleDiameter,
			PARAMETER_BOUNDS.thumbHoleDiameter
		),
		thumbHoleAngle: clamp(
			source.thumbHoleAngle,
			DEFAULT_FLUTE_PARAMETERS.thumbHoleAngle,
			PARAMETER_BOUNDS.thumbHoleAngle
		),
		overhangLength: clamp(
			source.overhangLength,
			DEFAULT_FLUTE_PARAMETERS.overhangLength,
			PARAMETER_BOUNDS.overhangLength
		),
		corkDistance: normalizeComputed(
			source.corkDistance,
			DEFAULT_FLUTE_PARAMETERS.corkDistance,
			PARAMETER_BOUNDS.corkDistance
		),
		corkThickness: normalizeComputed(
			source.corkThickness,
			DEFAULT_FLUTE_PARAMETERS.corkThickness,
			PARAMETER_BOUNDS.corkThickness
		),
		embouchureHoleLength: clamp(
			source.embouchureHoleLength,
			DEFAULT_FLUTE_PARAMETERS.embouchureHoleLength,
			PARAMETER_BOUNDS.embouchureHoleLength
		),
		embouchureHoleWidth: clamp(
			source.embouchureHoleWidth,
			DEFAULT_FLUTE_PARAMETERS.embouchureHoleWidth,
			PARAMETER_BOUNDS.embouchureHoleWidth
		),
		lipCoveragePercent: clamp(
			source.lipCoveragePercent,
			DEFAULT_FLUTE_PARAMETERS.lipCoveragePercent,
			PARAMETER_BOUNDS.lipCoveragePercent
		),
		// Compatibility outputs never enter calculation.
		embouchureDistance: 0,
		fluteLength: 0,
		numberOfToneHoles: clamp(
			source.numberOfToneHoles,
			DEFAULT_FLUTE_PARAMETERS.numberOfToneHoles,
			PARAMETER_BOUNDS.numberOfToneHoles,
			true
		),
		fundamentalFrequency: clamp(
			source.fundamentalFrequency,
			DEFAULT_FLUTE_PARAMETERS.fundamentalFrequency,
			PARAMETER_BOUNDS.fundamentalFrequency
		),
		toneHoleFilletRadius: clamp(
			source.toneHoleFilletRadius,
			DEFAULT_FLUTE_PARAMETERS.toneHoleFilletRadius,
			PARAMETER_BOUNDS.toneHoleFilletRadius
		),
		connectorLength: clamp(
			source.connectorLength,
			DEFAULT_FLUTE_PARAMETERS.connectorLength,
			PARAMETER_BOUNDS.connectorLength
		),
		numberOfCuts: cuts,
		cutDistances: Array.from({ length: cuts }, (_, index) =>
			clamp(sourceDistances[index], 0, PARAMETER_BOUNDS.cutDistance)
		)
	};
}

export function normalizeToneHoleParameters(value: unknown): ToneHoleParameters {
	const source =
		value && typeof value === 'object' ? (value as Partial<ToneHoleParameters>) : {};
	const normalizeArray = (
		input: unknown,
		defaults: number[],
		bounds: { min: number; max: number }
	) => {
		const values = Array.isArray(input) ? input : [];
		return Array.from({ length: MAX_TONE_HOLES }, (_, index) =>
			clamp(values[index], defaults[index], bounds)
		);
	};

	return {
		holeDiameters: normalizeArray(
			source.holeDiameters,
			DEFAULT_TONE_HOLE_PARAMETERS.holeDiameters,
			PARAMETER_BOUNDS.holeDiameter
		),
		holeCents: normalizeArray(
			source.holeCents,
			DEFAULT_TONE_HOLE_PARAMETERS.holeCents,
			PARAMETER_BOUNDS.holeCents
		),
		holeDistances: normalizeArray(
			source.holeDistances,
			DEFAULT_TONE_HOLE_PARAMETERS.holeDistances,
			PARAMETER_BOUNDS.holeDistance
		),
		holeAngles: normalizeArray(
			source.holeAngles,
			DEFAULT_TONE_HOLE_PARAMETERS.holeAngles,
			PARAMETER_BOUNDS.holeAngle
		),
		// Compatibility output never enters calculation.
		cutoffRatios: [...DEFAULT_TONE_HOLE_PARAMETERS.cutoffRatios]
	};
}

export function normalizeDesignDraft(value: unknown): DesignDraft {
	const source = value && typeof value === 'object' ? (value as Partial<DesignDraft>) : {};
	return {
		flute: normalizeFluteParameters(source.flute),
		toneHoles: normalizeToneHoleParameters(source.toneHoles)
	};
}
