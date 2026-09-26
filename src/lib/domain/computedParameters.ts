import type { FluteParameters } from './fluteTypes';

export type ComputedFluteParameter = 'corkDistance' | 'corkThickness';

function round(value: number, precision = 2): number {
	return Number(value.toFixed(precision));
}

export function getDefaultCorkDistance(params: FluteParameters): number {
	return round(params.embouchureHoleLength / 2 + 0.2 * params.boreDiameter, 3);
}

export function getDefaultCorkThickness(params: FluteParameters): number {
	return round(params.boreDiameter * 0.4, 3);
}

/** Resolves an automatic parameter without depending on UI or persisted state. */
export function resolveComputedParameter(
	param: ComputedFluteParameter,
	params: FluteParameters
): number {
	const computedParam = params[param];

	if (computedParam.mode === 'manual' && computedParam.value !== undefined) {
		return computedParam.value;
	}

	return param === 'corkDistance'
		? getDefaultCorkDistance(params)
		: getDefaultCorkThickness(params);
}
