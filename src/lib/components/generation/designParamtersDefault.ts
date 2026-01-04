import type { FluteParameters } from '$lib/stores/fluteStore';

export function getDefaultCorkDistance(params: FluteParameters): number {
	return params.embouchureHoleLength / 2 + 0.2 * params.boreDiameter;
}

export function getDefaultCorkThickness(params: FluteParameters): number {
	return params.boreDiameter * 0.4;
}
