export interface ValidationResult {
	status: 'success' | 'warning' | 'error';
	message?: string;
}

export const MIN_CONNECTOR_SPACING = 10;

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
	if (value < 10) {
		return { status: 'warning', message: 'Narrow bore may restrict airflow' };
	}
	if (value > 25) {
		return { status: 'warning', message: 'Wide bore may be harder to play' };
	}
	return { status: 'success' };
}

export function validateWallThickness(value: number): ValidationResult {
	if (value < 2) {
		return { status: 'error', message: 'Too thin, structural integrity at risk' };
	}
	if (value > 4) {
		return { status: 'warning', message: 'Thick walls may affect tone' };
	}
	return { status: 'success' };
}

export function validateDiameter(value: number): { status: 'success' | 'warning' | 'error'; message?: string } {
    if (value < 3) {
        return { status: 'error', message: 'Hole diameter too small. Minimum 3mm.' };
    }
    if (value > 15) {
        return { status: 'error', message: 'Hole diameter too large. Maximum 15mm.' };
    }
    if (value < 5) {
        return { status: 'warning', message: 'Very small hole. May be difficult to cover.' };
    }
    if (value > 12) {
        return { status: 'warning', message: 'Very large hole. May affect tuning significantly.' };
    }
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
	const minSpacing = connectorLength + MIN_CONNECTOR_SPACING;

	if (cutDistance < lowerBound) {
		return {
			status: 'error',
			message: `Cut must be at least ${lowerBound.toFixed(1)}mm from base`
		};
	}

	if (cutDistance > upperBound) {
		return {
			status: 'error',
			message: `Cut must be at most ${upperBound.toFixed(1)}mm (clear of embouchure)`
		};
	}

	if (cutDistance > fluteLength) {
		return {
			status: 'error',
			message: `Cut cannot exceed flute length (${fluteLength.toFixed(1)}mm)`
		};
	}

	for (let i = 0; i < allCutDistances.length; i++) {
		if (i !== cutIndex) {
			const otherCut = allCutDistances[i];
			if (otherCut > 0 && Math.abs(cutDistance - otherCut) < minSpacing) {
				return {
					status: 'error',
					message: `Cuts must be at least ${minSpacing}mm apart (from Cut ${i + 1})`
				};
			}
		}
	}

	return { status: 'success' };
}