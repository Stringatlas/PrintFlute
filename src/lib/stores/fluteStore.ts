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
	overhangLength: 20,
	corkDistance: undefined,
	corkThickness: undefined,
	embouchureHoleLength: 9.5,
	embouchureHoleWidth: 9.5,
	lipCoveragePercent: 5,
	numberOfToneHoles: 6,
	fundamentalFrequency: 587.33,
	toneHoleFilletRadius: 1.5,
	connectorLength: 15,
	numberOfCuts: 1,
	cutDistances: [0],
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

export interface MeshResolution {
	preview: {
		radialSegments: number;
		heightSegments: number;
	};
	export: {
		radialSegments: number;
		heightSegments: number;
	};
}

export const DEFAULT_MESH_RESOLUTION: MeshResolution = {
	preview: {
		radialSegments: 32,
		heightSegments: 1,
	},
	export: {
		radialSegments: 64,
		heightSegments: 4,
	},
};

export const meshResolution = writable<MeshResolution>({ ...DEFAULT_MESH_RESOLUTION });

export interface ToneHoleParameters {
	holeDiameters: number[];
	holeCents: number[];
	holeDistances: number[];
	cutoffRatios: number[];
}

export const DEFAULT_TONEHOLE_PARAMETERS: ToneHoleParameters = {
	holeDiameters: [8, 8, 8, 8, 8, 8, 8, 8],
	holeCents: [200, 400, 500, 700, 900, 1100, 1200, 1400],
	holeDistances: [0, 0, 0, 0, 0, 0, 0, 0],
	cutoffRatios: [0, 0, 0, 0, 0, 0, 0, 0],
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
		resetAll: () => {
			set({ ...DEFAULT_TONEHOLE_PARAMETERS });
		},
	};
}

export const toneHoleParams = createToneHoleStore();
