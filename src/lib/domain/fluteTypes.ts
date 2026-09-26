export type ComputedParameter<T> = {
	mode: 'auto' | 'manual';
	value?: T;
};

/** Physical and acoustic inputs that describe a flute design. */
export interface FluteParameters {
	boreDiameter: number;
	wallThickness: number;
	hasThumbHole: boolean;
	thumbHoleDiameter: number;
	thumbHoleAngle: number;
	overhangLength: number;
	corkDistance: ComputedParameter<number>;
	corkThickness: ComputedParameter<number>;
	embouchureHoleLength: number;
	embouchureHoleWidth: number;
	lipCoveragePercent: number;
	embouchureDistance: number;
	fluteLength: number;
	numberOfToneHoles: number;
	fundamentalFrequency: number;
	toneHoleFilletRadius: number;
	connectorLength: number;
	numberOfCuts: number;
	cutDistances: number[];
}

/** Tuning inputs and calculated output for each tone hole. */
export interface ToneHoleParameters {
	holeDiameters: number[];
	holeCents: number[];
	holeDistances: number[];
	cutoffRatios: number[];
}

/**
 * Editable design payload used at the generation boundary.
 *
 * The nested objects intentionally retain the complete legacy parameter shapes.
 * `embouchureDistance`, `fluteLength`, `holeDistances`, and `cutoffRatios` are
 * compatibility fields: evaluators must ignore their incoming values and replace
 * them with calculated values in a resolved snapshot.
 */
export interface DesignDraft {
	flute: FluteParameters;
	toneHoles: ToneHoleParameters;
}
