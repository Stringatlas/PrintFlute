import { derived, get, writable, type Readable } from 'svelte/store';
import { fluteParams, toneHoleParams, type FluteParameters, type ToneHoleParameters } from '$lib/stores/fluteStore';
import { calculateFlutePositions, type FluteParams, type FluteResult, midiNoteToFrequency } from '$lib/acoustics/fluteCalculator';
import { resolveComputedParameter } from '$lib/components/generation/generation-steps/designParametersDefault';

export interface CalculatedHoleData {
	physicalPosition: number;
	cutoffRatio: number;
}

function centsToFrequency(fundamentalHz: number, cents: number): number {
	return fundamentalHz * Math.pow(2, cents / 1200);
}

const calculationErrorStore = writable<string | null>(null);

export const calculatedFluteData: Readable<FluteResult | null> = derived(
	[fluteParams, toneHoleParams],
	([$fluteParams, $toneHoleParams]) => {
		try {
			const holes = $toneHoleParams.holeCents
				.slice(0, $fluteParams.numberOfToneHoles)
				.map((cents, index) => ({
					frequency: centsToFrequency($fluteParams.fundamentalFrequency, cents),
					diameter: $toneHoleParams.holeDiameters[index] || 8
				}));

			// Calculate effective embouchure diameter from ellipse
			const embouchureDiameter = Math.sqrt(
				($fluteParams.embouchureHoleLength * $fluteParams.embouchureHoleWidth * 4) / Math.PI
			);

			const calculationParams: FluteParams = {
				boreDiameter: $fluteParams.boreDiameter,
				wallThickness: $fluteParams.wallThickness,
				embouchureDiameter,
				endFrequency: $fluteParams.fundamentalFrequency,
				holes,
				lipCoverPercent: $fluteParams.lipCoveragePercent
			};

			const result = calculateFlutePositions(calculationParams);
			calculationErrorStore.set(null);
			return result;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown calculation error';
			calculationErrorStore.set(errorMessage);
			console.error('Flute calculation error:', errorMessage);
			return null;
		}
	}
);

export const calculationError: Readable<string | null> = calculationErrorStore;

export function updateCalculatedValues(result: FluteResult | null, numberOfHoles: number): void {
	if (!result) return;

	const currentFluteParams = get(fluteParams);
	const embouchureDistance = result.embouchurePhysicalPosition;
	
	// Calculate total flute length: embouchureDistance + corkDistance + corkThickness + overhangLength
	const fluteLength = embouchureDistance + 
		resolveComputedParameter('corkDistance', currentFluteParams) +
		resolveComputedParameter('corkThickness', currentFluteParams) +
		currentFluteParams.overhangLength;
	
	fluteParams.updateParameter('embouchureDistance', embouchureDistance);
	fluteParams.updateParameter('fluteLength', fluteLength);

	const currentParams = get(toneHoleParams);
	const newDistances = [...currentParams.holeDistances];
	const newRatios = [...currentParams.cutoffRatios];

	result.holes.forEach((hole, index) => {
		if (index < numberOfHoles) {
			newDistances[index] = isNaN(hole.physicalPosition) ? 0 : hole.physicalPosition;
			const ratio = hole.cutoffFrequency / hole.frequency;
			newRatios[index] = isNaN(ratio) ? 0 : ratio;
		}
	});

	toneHoleParams.updateToneHoleParams({
		holeDistances: newDistances,
		cutoffRatios: newRatios
	});
}
