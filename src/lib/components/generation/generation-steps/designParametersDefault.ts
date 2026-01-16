import type { FluteParameters } from '$lib/stores/fluteStore';

function round(value: number, precision: number = 2): number {
    return Number(value.toFixed(precision));
}

export function getDefaultCorkDistance(params: FluteParameters): number {
	return round(params.embouchureHoleLength / 2 + 0.2 * params.boreDiameter, 3);
}

export function getDefaultCorkThickness(params: FluteParameters): number {
	return round(params.boreDiameter * 0.4, 3);
}

export function resolveComputedParameter(
	param: 'corkDistance' | 'corkThickness',
	params: FluteParameters
): number {
	const computedParam = params[param];
	
	if (computedParam.mode === 'manual' && computedParam.value !== undefined) {
		return computedParam.value;
	}
	
	switch (param) {
		case 'corkDistance':
			return getDefaultCorkDistance(params);
		case 'corkThickness':
			return getDefaultCorkThickness(params);
	}
}
