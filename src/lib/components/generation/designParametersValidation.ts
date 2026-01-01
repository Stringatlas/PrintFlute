export interface ValidationResult {
	status: 'success' | 'warning' | 'error';
	message?: string;
}

export function validateLength(value: number): ValidationResult {
	if (value < 250) {
		return { status: 'warning', message: 'Very short flute, may be difficult to play' };
	}
	if (value > 550) {
		return { status: 'warning', message: 'Very long flute, may be unwieldy' };
	}
	return { status: 'success' };
}

export function validateBoreDiameter(value: number): ValidationResult {
	if (value < 15) {
		return { status: 'warning', message: 'Narrow bore may restrict airflow' };
	}
	if (value > 25) {
		return { status: 'warning', message: 'Wide bore may be harder to play' };
	}
	return { status: 'success' };
}

export function validateWallThickness(value: number): ValidationResult {
	if (value < 1.5) {
		return { status: 'error', message: 'Too thin, structural integrity at risk' };
	}
	if (value > 4) {
		return { status: 'warning', message: 'Thick walls may affect tone' };
	}
	return { status: 'success' };
}
