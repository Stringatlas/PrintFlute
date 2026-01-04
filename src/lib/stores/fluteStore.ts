import { writable } from 'svelte/store';

export interface FluteParameters {
	// Physical Parameters
	boreDiameter: number;
	wallThickness: number;
	hasThumbHole: boolean;
	overhangLength: number;
	corkDistance: number | undefined;
	corkThickness: number | undefined;
	
	// Embouchure Hole Parameters
	embouchureHoleLength: number;
	embouchureHoleWidth: number;
	lipCoveragePercent: number;
	
	// Tuning Parameters
	numberOfToneHoles: number;
	fundamentalFrequency: number;
}

export const DEFAULT_PARAMETERS: FluteParameters = {
	boreDiameter: 14.3,
	wallThickness: 2.5,
	hasThumbHole: true,
	overhangLength: 20,
	corkDistance: undefined,
	corkThickness: undefined,
	embouchureHoleLength: 9.5,
	embouchureHoleWidth: 9.5,
	lipCoveragePercent: 5,
	numberOfToneHoles: 6,
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
