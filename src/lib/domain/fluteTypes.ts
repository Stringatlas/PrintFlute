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

/** Physical tone-hole geometry plus optional acoustic targets and analysis output. */
export interface ToneHoleParameters {
	holeDiameters: number[];
	holeDistances: number[];
	holeAngles: number[];
	/** Optional target pitch used by the tuning guidance layer. */
	holeCents: number[];
	/** Compatibility output populated by acoustic analysis. */
	cutoffRatios: number[];
}

/**
 * Editable design payload used at the generation boundary.
 *
 * The nested objects intentionally retain the complete legacy parameter shapes.
 * `embouchureDistance`, `fluteLength`, and `cutoffRatios` are compatibility
 * outputs. Tone-hole diameter, distance, and angle are editable geometry and
 * must never be overwritten by acoustic evaluation.
 */
export interface DesignDraft {
	flute: FluteParameters;
	toneHoles: ToneHoleParameters;
}
