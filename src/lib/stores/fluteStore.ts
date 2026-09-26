import { derived, get, type Readable } from 'svelte/store';
import { localGenerationApi } from '$lib/api/generation/local';
import type { ComputedParameter, FluteParameters, ToneHoleParameters } from '$lib/domain/fluteTypes';
import { DesignController } from '$lib/services/designController';
import {
	DEFAULT_FLUTE_PARAMETERS,
	DEFAULT_TONE_HOLE_PARAMETERS,
	normalizeFluteParameters,
	normalizeToneHoleParameters
} from '$lib/services/designNormalization';
import { localStorageStore } from '$lib/utils/localStorageStore';
import { validateDesign, type ValidationIssue } from '$lib/validation/designParameters';

// Compatibility exports; new code should import domain types from $lib/domain/fluteTypes.
export type { ComputedParameter, FluteParameters, ToneHoleParameters } from '$lib/domain/fluteTypes';

export const DEFAULT_PARAMETERS = DEFAULT_FLUTE_PARAMETERS;
export const DEFAULT_TONEHOLE_PARAMETERS = DEFAULT_TONE_HOLE_PARAMETERS;
export { normalizeFluteParameters, normalizeToneHoleParameters };

const persistedFluteParams = localStorageStore(
	'flute-generator-parameters',
	DEFAULT_PARAMETERS,
	{ normalize: normalizeFluteParameters }
);
const persistedToneHoleParams = localStorageStore(
	'flute-generator-tone-holes',
	DEFAULT_TONEHOLE_PARAMETERS,
	{ normalize: normalizeToneHoleParameters }
);

export const designController = new DesignController(localGenerationApi, {
	flute: get(persistedFluteParams),
	toneHoles: get(persistedToneHoleParams)
});

designController.design.subscribe((design) => {
	persistedFluteParams.set(design.flute);
	persistedToneHoleParams.set(design.toneHoles);
});

function createFluteStore() {
	const store = derived(designController.design, (design) => design.flute);
	return {
		subscribe: store.subscribe,
		updateParameter: <K extends keyof FluteParameters>(key: K, value: FluteParameters[K]) =>
			designController.set(`flute.${key}`, value),
		resetParameter: <K extends keyof FluteParameters>(key: K) =>
			designController.set(`flute.${key}`, DEFAULT_PARAMETERS[key]),
		setComputedOverride: (key: 'corkDistance' | 'corkThickness', value: number) =>
			designController.set(`flute.${key}`, { mode: 'manual', value }),
		resetComputedToAuto: (key: 'corkDistance' | 'corkThickness') =>
			designController.set(`flute.${key}`, { mode: 'auto' }),
		resetAll: () =>
			designController.replace({
				flute: DEFAULT_PARAMETERS,
				toneHoles: get(designController.design).toneHoles
			})
	};
}

function createToneHoleStore() {
	const store = derived(designController.design, (design) => design.toneHoles);
	const updateArray = (key: keyof ToneHoleParameters, index: number, value: number) =>
		designController.set(`toneHoles.${key}.${index}`, value);
	return {
		subscribe: store.subscribe,
		updateHoleDiameter: (index: number, value: number) => updateArray('holeDiameters', index, value),
		updateHoleCents: (index: number, value: number) => updateArray('holeCents', index, value),
		updateHoleDistance: (index: number, value: number) => updateArray('holeDistances', index, value),
		updateCutoffRatio: (index: number, value: number) => updateArray('cutoffRatios', index, value),
		updateToneHoleParams: (params: Partial<ToneHoleParameters>) => {
			const design = get(designController.design);
			return designController.replace({
				flute: design.flute,
				toneHoles: { ...design.toneHoles, ...params }
			});
		},
		resetAll: () =>
			designController.replace({
				flute: get(designController.design).flute,
				toneHoles: DEFAULT_TONEHOLE_PARAMETERS
			})
	};
}

export const fluteParams = createFluteStore();
export const toneHoleParams = createToneHoleStore();
export const resolvedDesignSnapshot = designController.snapshot;
export const generationPending = designController.pending;
export const generationError = designController.error;
export const designRevision = designController.revision;

/** A single source of truth for form summaries and future step/export guards. */
export const designValidation: Readable<ValidationIssue[]> = derived(
	[fluteParams, toneHoleParams],
	([$fluteParams, $toneHoleParams]) => validateDesign($fluteParams, $toneHoleParams)
);
