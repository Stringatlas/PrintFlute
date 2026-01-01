import { writable } from 'svelte/store';

export interface FluteParameters {
	// Physical Parameters
	boreDiameter: number;
	wallThickness: number;
	
	// Basic Parameters
	length: number;
	numberOfHoles: number;
	fundamentalFrequency: number;
}

export const DEFAULT_PARAMETERS: FluteParameters = {
	boreDiameter: 19,
	wallThickness: 2,
	length: 400,
	numberOfHoles: 6,
	fundamentalFrequency: 587.33,
};

function createFluteStore() {
	const { subscribe, set, update } = writable<FluteParameters>({ ...DEFAULT_PARAMETERS });

	return {
		subscribe,
		updateParameter: <K extends keyof FluteParameters>(key: K, value: FluteParameters[K]) => {
			update(params => ({ ...params, [key]: value }));
		},
		resetParameter: <K extends keyof FluteParameters>(key: K) => {
			update(params => ({ ...params, [key]: DEFAULT_PARAMETERS[key] }));
		},
		resetAll: () => {
			set({ ...DEFAULT_PARAMETERS });
		},
	};
}

export const fluteParams = createFluteStore();

export type ViewMode = 'basic' | 'advanced';
export const viewMode = writable<ViewMode>('basic');
