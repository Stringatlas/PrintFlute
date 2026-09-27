import { calculateFlutePositions, type FluteParams, type FluteResult } from '$lib/acoustics/fluteCalculator';
import { resolveComputedParameter } from '$lib/domain/computedParameters';
import type { FluteParameters, ToneHoleParameters } from '$lib/domain/fluteTypes';

export interface CalculatedFluteUpdates {
	embouchureDistance: number;
	fluteLength: number;
	holeDistances: number[];
	cutoffRatios: number[];
}

/** Calculates opt-in starting geometry without changing an existing design. */
export function calculateRecommendedHoleDistances(
	fluteParams: FluteParameters,
	toneHoleParams: ToneHoleParameters
): number[] {
	const result = calculateFluteData(fluteParams, toneHoleParams);
	return toneHoleParams.holeDistances.map((existing, index) =>
		result.holes[index]?.physicalPosition ?? existing
	);
}

function centsToFrequency(fundamentalHz: number, cents: number): number {
	return fundamentalHz * Math.pow(2, cents / 1200);
}

/** Pure acoustic calculation: design inputs in, calculated flute data out. */
export function calculateFluteData(
	fluteParams: FluteParameters,
	toneHoleParams: ToneHoleParameters
): FluteResult {
	const holes = toneHoleParams.holeCents
		.slice(0, fluteParams.numberOfToneHoles)
		.map((cents, index) => ({
			frequency: centsToFrequency(fluteParams.fundamentalFrequency, cents),
			diameter: toneHoleParams.holeDiameters[index] || 8
		}));

	const embouchureDiameter = Math.sqrt(
		(fluteParams.embouchureHoleLength * fluteParams.embouchureHoleWidth * 4) / Math.PI
	);

	const calculationParams: FluteParams = {
		boreDiameter: fluteParams.boreDiameter,
		wallThickness: fluteParams.wallThickness,
		embouchureDiameter,
		endFrequency: fluteParams.fundamentalFrequency,
		holes,
		lipCoverPercent: fluteParams.lipCoveragePercent
	};

	return calculateFlutePositions(calculationParams);
}

/** Pure projection of an acoustic result onto the values stored by the designer. */
export function calculateFluteUpdates(
	result: FluteResult,
	numberOfHoles: number,
	fluteParams: FluteParameters,
	toneHoleParams: ToneHoleParameters
): CalculatedFluteUpdates {
	const embouchureDistance = result.embouchurePhysicalPosition;
	const fluteLength = embouchureDistance
		+ resolveComputedParameter('corkDistance', fluteParams)
		+ resolveComputedParameter('corkThickness', fluteParams)
		+ fluteParams.overhangLength;
	const holeDistances = [...toneHoleParams.holeDistances];
	const cutoffRatios = [...toneHoleParams.cutoffRatios];

	result.holes.forEach((hole, index) => {
		if (index >= numberOfHoles) return;
		holeDistances[index] = Number.isNaN(hole.physicalPosition) ? 0 : hole.physicalPosition;
		const ratio = hole.cutoffFrequency / hole.frequency;
		cutoffRatios[index] = Number.isNaN(ratio) ? 0 : ratio;
	});

	return { embouchureDistance, fluteLength, holeDistances, cutoffRatios };
}
