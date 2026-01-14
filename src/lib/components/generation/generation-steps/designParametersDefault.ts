import type { FluteParameters } from '$lib/stores/fluteStore';

export function getDefaultCorkDistance(params: FluteParameters): number {
	return params.embouchureHoleLength / 2 + 0.2 * params.boreDiameter;
}

export function getDefaultCorkThickness(params: FluteParameters): number {
	return params.boreDiameter * 0.4;
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
