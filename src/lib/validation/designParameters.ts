import type { FluteParameters, ToneHoleParameters } from '$lib/domain/fluteTypes';

export type ValidationStatus = 'success' | 'warning' | 'error';

export interface ValidationResult {
	status: ValidationStatus;
	message?: string;
}

export interface ValidationIssue extends ValidationResult {
	path: string;
}

export const MIN_CONNECTOR_SPACING = 10;
export const MAX_TONE_HOLES = 8;

/** Bounds used by the store as well as form controls. */
export const PARAMETER_BOUNDS = {
	boreDiameter: { min: 10, max: 30 },
	wallThickness: { min: 1, max: 5 },
	thumbHoleDiameter: { min: 3, max: 12 },
	thumbHoleAngle: { min: 0, max: 90 },
	overhangLength: { min: 0, max: 50 },
	corkDistance: { min: 5, max: 30 },
	corkThickness: { min: 1, max: 5 },
	embouchureHoleLength: { min: 5, max: 20 },
	embouchureHoleWidth: { min: 5, max: 15 },
	lipCoveragePercent: { min: 0, max: 100 },
	fundamentalFrequency: { min: 220, max: 880 },
	numberOfToneHoles: { min: 3, max: MAX_TONE_HOLES },
	toneHoleFilletRadius: { min: 0, max: 3 },
	connectorLength: { min: 5, max: 30 },
	numberOfCuts: { min: 0, max: 5 },
	cutDistance: { min: 0, max: 500 },
	holeDiameter: { min: 3, max: 15 },
	holeCents: { min: 0, max: 2400 }
} as const;

export function validateLength(value: number): ValidationResult {
	if (value < 250) return { status: 'warning', message: 'Very short flute, may be difficult to play' };
	if (value > 550) return { status: 'warning', message: 'Very long flute, may be unwieldy' };
	return { status: 'success' };
}

export function validateBoreDiameter(value: number): ValidationResult {
	if (value < 10) return { status: 'warning', message: 'Narrow bore may restrict airflow' };
	if (value > 25) return { status: 'warning', message: 'Wide bore may be harder to play' };
	return { status: 'success' };
}

export function validateWallThickness(value: number): ValidationResult {
	if (value < 2) return { status: 'error', message: 'Too thin, structural integrity at risk' };
	if (value > 4) return { status: 'warning', message: 'Thick walls may affect tone' };
	return { status: 'success' };
}

export function validateDiameter(value: number): ValidationResult {
	if (value < PARAMETER_BOUNDS.holeDiameter.min) return { status: 'error', message: 'Hole diameter too small. Minimum 3mm.' };
	if (value > PARAMETER_BOUNDS.holeDiameter.max) return { status: 'error', message: 'Hole diameter too large. Maximum 15mm.' };
	if (value < 5) return { status: 'warning', message: 'Very small hole. May be difficult to cover.' };
	if (value > 12) return { status: 'warning', message: 'Very large hole. May affect tuning significantly.' };
	return { status: 'success' };
}

export function validateCutDistance(
	cutDistance: number,
	cutIndex: number,
	allCutDistances: number[],
	connectorLength: number,
	embouchureDistance: number,
	embouchureHoleLength: number,
	fluteLength: number
): ValidationResult {
	const lowerBound = connectorLength + MIN_CONNECTOR_SPACING;
	const upperBound = embouchureDistance - embouchureHoleLength / 2 - connectorLength - MIN_CONNECTOR_SPACING;
	if (cutDistance < lowerBound) return { status: 'error', message: `Cut must be at least ${lowerBound.toFixed(1)}mm from base` };
	if (cutDistance > upperBound) return { status: 'error', message: `Cut must be at most ${upperBound.toFixed(1)}mm (clear of embouchure)` };
	if (cutDistance > fluteLength) return { status: 'error', message: `Cut cannot exceed flute length (${fluteLength.toFixed(1)}mm)` };
	for (let i = 0; i < allCutDistances.length; i++) {
		if (i !== cutIndex && allCutDistances[i] > 0 && Math.abs(cutDistance - allCutDistances[i]) < lowerBound) {
			return { status: 'error', message: `Cuts must be at least ${lowerBound.toFixed(1)}mm apart (from Cut ${i + 1})` };
		}
	}
	return { status: 'success' };
}

/** Validation that requires the complete design rather than a single input. */
export function validateDesign(params: FluteParameters, toneHoles: ToneHoleParameters): ValidationIssue[] {
	const issues: ValidationIssue[] = [];
	const add = (path: string, result: ValidationResult) => {
		if (result.status !== 'success') issues.push({ path, ...result });
	};

	add('boreDiameter', validateBoreDiameter(params.boreDiameter));
	add('wallThickness', validateWallThickness(params.wallThickness));
	add('fluteLength', validateLength(params.fluteLength));

	for (let index = 0; index < params.numberOfToneHoles; index++) {
		add(`holeDiameters.${index}`, validateDiameter(toneHoles.holeDiameters[index]));
	}
	for (let index = 0; index < params.cutDistances.length; index++) {
		add(`cutDistances.${index}`, validateCutDistance(
			params.cutDistances[index], index, params.cutDistances, params.connectorLength,
			params.embouchureDistance, params.embouchureHoleLength, params.fluteLength
		));
	}
	return issues;
}
