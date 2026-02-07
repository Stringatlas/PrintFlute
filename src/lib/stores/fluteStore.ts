import { writable } from 'svelte/store';

export type ComputedParameter<T> = {
	mode: 'auto' | 'manual';
	value?: T;
};

export interface FluteParameters {
	// Physical Parameters
	boreDiameter: number;
	wallThickness: number;
	hasThumbHole: boolean;
	thumbHoleDiameter: number;
	thumbHoleAngle: number;
	overhangLength: number;
	corkDistance: ComputedParameter<number>;
	corkThickness: ComputedParameter<number>;
	
	// Embouchure Hole Parameters
	embouchureHoleLength: number;
	embouchureHoleWidth: number;
	lipCoveragePercent: number;
	embouchureDistance: number;
	fluteLength: number;
	
	// Tuning Parameters
	numberOfToneHoles: number;
	fundamentalFrequency: number;
	
	// Printing Parameters
	toneHoleFilletRadius: number;
	connectorLength: number;
	numberOfCuts: number;
	cutDistances: number[];
}

export const DEFAULT_PARAMETERS: FluteParameters = {
	boreDiameter: 14.3,
	wallThickness: 2.5,
	hasThumbHole: true,
	thumbHoleDiameter: 6,
	thumbHoleAngle: 0,
	overhangLength: 20,
	corkDistance: { mode: 'auto' },
	corkThickness: { mode: 'auto' },
	embouchureHoleLength: 9.5,
	embouchureHoleWidth: 9.5,
	lipCoveragePercent: 5,
	embouchureDistance: 0,
	fluteLength: 0,
	numberOfToneHoles: 6,
	fundamentalFrequency: 587.33,
	toneHoleFilletRadius: 1.5,
	connectorLength: 15,
	numberOfCuts: 1,
	cutDistances: [180],
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
		setComputedOverride: (key: 'corkDistance' | 'corkThickness', value: number) => {
			update(params => ({
				...params,
				[key]: { mode: 'manual' as const, value }
			}));
		},
		resetComputedToAuto: (key: 'corkDistance' | 'corkThickness') => {
			update(params => ({
				...params,
				[key]: { mode: 'auto' as const }
			}));
		},
		resetAll: () => {
			set({ ...DEFAULT_PARAMETERS });
		},
	};
}

export const fluteParams = createFluteStore();

export interface ToneHoleParameters {
	holeDiameters: number[];
	holeCents: number[];
	holeDistances: number[];
	cutoffRatios: number[];
}

export const DEFAULT_TONEHOLE_PARAMETERS: ToneHoleParameters = {
	holeDiameters: [7.5, 8, 5, 6, 6.5, 5.5],
	holeCents: [200, 400, 500, 700, 900, 1100, 1200, 1400],
	holeDistances: [0, 0, 0, 0, 0, 0],
	cutoffRatios: [0, 0, 0, 0, 0, 0],
};

function createToneHoleStore() {
	const { subscribe, set, update } = writable<ToneHoleParameters>({ ...DEFAULT_TONEHOLE_PARAMETERS });

	return {
		subscribe,
		updateHoleDiameter: (index: number, value: number) => {
			update(params => {
				const newDiameters = [...params.holeDiameters];
				newDiameters[index] = value;
				return { ...params, holeDiameters: newDiameters };
			});
		},
		updateHoleCents: (index: number, value: number) => {
			update(params => {
				const newCents = [...params.holeCents];
				newCents[index] = value;
				return { ...params, holeCents: newCents };
			});
		},
		updateHoleDistance: (index: number, value: number) => {
			update(params => {
				const newDistances = [...params.holeDistances];
				newDistances[index] = value;
				return { ...params, holeDistances: newDistances };
			});
		},
		updateCutoffRatio: (index: number, value: number) => {
			update(params => {
				const newRatios = [...params.cutoffRatios];
				newRatios[index] = value;
				return { ...params, cutoffRatios: newRatios };
			});
		},
		updateToneHoleParams: (params: Partial<ToneHoleParameters>) => {
			update(current => ({
				...current,
				...params
			}));
		},
		resetAll: () => {
			set({ ...DEFAULT_TONEHOLE_PARAMETERS });
		},
	};
}

export const toneHoleParams = createToneHoleStore();
