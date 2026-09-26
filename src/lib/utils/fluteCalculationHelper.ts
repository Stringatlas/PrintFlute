import { derived, type Readable } from 'svelte/store';
import type { FluteResult } from '$lib/acoustics/fluteCalculator';
import {
	generationError,
	resolvedDesignSnapshot
} from '$lib/stores/fluteStore';

export interface CalculatedHoleData {
	physicalPosition: number;
	cutoffRatio: number;
}

export const calculatedFluteData: Readable<FluteResult | null> = derived(
	resolvedDesignSnapshot,
	(snapshot) => snapshot?.calculation.data ?? null
);

export const calculationError: Readable<string | null> = derived(
	generationError,
	(error) => error?.message ?? null
);

/**
 * @deprecated Derived compatibility values are now written by DesignController.
 * Kept as a no-op until all existing UI call sites migrate to the snapshot.
 */
export function updateCalculatedValues(
	_result: FluteResult | null,
	_numberOfHoles: number
): void {
	// Intentionally empty.
}
