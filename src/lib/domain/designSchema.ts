import type {
	DesignDraft,
	DesignParameterPath,
	FluteParameters,
	ToneHoleArrayKey
} from '$lib/api/generation/contracts';
import {
	PARAMETER_BOUNDS,
	validateBoreDiameter,
	validateCutDistance,
	validateDiameter,
	validateLength,
	validateWallThickness,
	type ValidationResult
} from '$lib/validation/designParameters';

export type ParameterVisibility = 'always' | 'basic' | 'advanced';
export type ParameterInput = 'number' | 'slider' | 'checkbox' | 'frequency' | 'display';
export type ParameterUnit = '' | 'mm' | 'Hz' | 'cents' | '%' | 'deg' | ' holes' | ' cuts';
export type ParameterPathPattern =
	| DesignParameterPath
	| `toneHoles.${ToneHoleArrayKey}.\${number}`;

export type ParameterDefaultSource =
	| { kind: 'legacy-default'; key: keyof FluteParameters | ToneHoleArrayKey }
	| { kind: 'computed'; dependencies: readonly DesignParameterPath[] }
	| { kind: 'diatonic-scale' }
	| { kind: 'acoustic-calculation' }
	| { kind: 'zero' };

export interface ParameterVisibilityCondition {
	path: DesignParameterPath;
	equals: boolean | number;
}

export interface ParameterValidationContext {
	design: DesignDraft;
	index?: number;
}

export type ParameterValidator = (
	value: number,
	context?: ParameterValidationContext
) => ValidationResult;

export interface ParameterFieldSchema {
	path: ParameterPathPattern;
	label: string;
	tooltip: string;
	unit: ParameterUnit;
	input: ParameterInput;
	visibility: ParameterVisibility;
	defaultSource: ParameterDefaultSource;
	readOnly: boolean;
	derived: boolean;
	dependencies: readonly DesignParameterPath[];
	bounds?: (typeof PARAMETER_BOUNDS)[keyof typeof PARAMETER_BOUNDS];
	step?: number;
	autoManual?: boolean;
	visibleWhen?: ParameterVisibilityCondition;
	validate?: ParameterValidator;
}

type FluteFieldSchemaMap = {
	[Key in keyof FluteParameters]: ParameterFieldSchema & { path: `flute.${Key}` };
};

type ToneHoleFieldSchemaMap = {
	[Key in keyof DesignDraft['toneHoles']]: ParameterFieldSchema & {
		path: `toneHoles.${Key}.\${number}`;
	};
};

type FieldOptions = Omit<
	ParameterFieldSchema,
	'path' | 'readOnly' | 'derived' | 'dependencies' | 'unit' | 'visibility'
> & {
	unit?: ParameterUnit;
	visibility?: ParameterVisibility;
	readOnly?: boolean;
	derived?: boolean;
	dependencies?: readonly DesignParameterPath[];
};

function field<Path extends ParameterPathPattern>(
	path: Path,
	options: FieldOptions
): ParameterFieldSchema & { path: Path } {
	return {
		path,
		unit: '',
		visibility: 'always',
		readOnly: false,
		derived: false,
		dependencies: [],
		...options
	};
}

function bounded<Path extends ParameterPathPattern>(
	path: Path,
	bounds: keyof typeof PARAMETER_BOUNDS,
	options: Omit<FieldOptions, 'bounds'>
): ParameterFieldSchema & { path: Path } {
	return field(path, { ...options, bounds: PARAMETER_BOUNDS[bounds] });
}

const acousticDependencies = [
	'flute.boreDiameter',
	'flute.wallThickness',
	'flute.embouchureHoleLength',
	'flute.embouchureHoleWidth',
	'flute.lipCoveragePercent',
	'flute.fundamentalFrequency',
	'flute.numberOfToneHoles'
] as const satisfies readonly DesignParameterPath[];

export const FLUTE_FIELDS = {
	boreDiameter: bounded('flute.boreDiameter', 'boreDiameter', {
		label: 'Bore Diameter',
		tooltip: 'The internal diameter of the flute tube. Larger bores produce louder, darker tones while smaller bores create a brighter, focused sound.',
		unit: 'mm', input: 'number', step: 0.5,
		defaultSource: { kind: 'legacy-default', key: 'boreDiameter' },
		validate: validateBoreDiameter
	}),
	wallThickness: bounded('flute.wallThickness', 'wallThickness', {
		label: 'Wall Thickness',
		tooltip: 'Thickness of the flute tube walls. It affects resonance and structural integrity.',
		unit: 'mm', input: 'number', step: 0.1,
		defaultSource: { kind: 'legacy-default', key: 'wallThickness' },
		validate: validateWallThickness
	}),
	hasThumbHole: field('flute.hasThumbHole', {
		label: 'Thumb Hole',
		tooltip: 'Adds a thumb hole on the back of the flute for extended note range and chromatic playing.',
		input: 'checkbox',
		defaultSource: { kind: 'legacy-default', key: 'hasThumbHole' }
	}),
	thumbHoleDiameter: bounded('flute.thumbHoleDiameter', 'thumbHoleDiameter', {
		label: 'Thumb Hole Diameter',
		tooltip: 'Diameter of the thumb hole. Smaller holes are easier to half-hole for chromatic notes.',
		unit: 'mm', input: 'number', step: 0.5,
		defaultSource: { kind: 'legacy-default', key: 'thumbHoleDiameter' },
		visibleWhen: { path: 'flute.hasThumbHole', equals: true }
	}),
	thumbHoleAngle: bounded('flute.thumbHoleAngle', 'thumbHoleAngle', {
		label: 'Thumb Hole Angle',
		tooltip: 'Angular position of the thumb hole. 0 degrees places it at the bottom and 90 degrees on the side.',
		unit: 'deg', input: 'slider', step: 5,
		defaultSource: { kind: 'legacy-default', key: 'thumbHoleAngle' },
		visibleWhen: { path: 'flute.hasThumbHole', equals: true }
	}),
	overhangLength: bounded('flute.overhangLength', 'overhangLength', {
		label: 'Overhang Length',
		tooltip: 'Distance the tube extends beyond the embouchure hole toward the closed end.',
		unit: 'mm', input: 'number', step: 1, visibility: 'advanced',
		defaultSource: { kind: 'legacy-default', key: 'overhangLength' }
	}),
	corkDistance: bounded('flute.corkDistance', 'corkDistance', {
		label: 'Cork Distance',
		tooltip: 'Distance from the embouchure hole center to the cork or end cap.',
		unit: 'mm', input: 'number', step: 0.5, visibility: 'advanced',
		defaultSource: {
			kind: 'computed',
			dependencies: ['flute.embouchureHoleLength', 'flute.boreDiameter']
		},
		autoManual: true,
		dependencies: ['flute.embouchureHoleLength', 'flute.boreDiameter']
	}),
	corkThickness: bounded('flute.corkThickness', 'corkThickness', {
		label: 'Cork Thickness',
		tooltip: 'Thickness of the cork or end cap material.',
		unit: 'mm', input: 'number', step: 0.1, visibility: 'advanced',
		defaultSource: { kind: 'computed', dependencies: ['flute.boreDiameter'] },
		autoManual: true,
		dependencies: ['flute.boreDiameter']
	}),
	embouchureHoleLength: bounded('flute.embouchureHoleLength', 'embouchureHoleLength', {
		label: 'Hole Length',
		tooltip: 'Length of the embouchure hole. Larger holes allow more airflow but require more breath control.',
		unit: 'mm', input: 'number', step: 0.5,
		defaultSource: { kind: 'legacy-default', key: 'embouchureHoleLength' }
	}),
	embouchureHoleWidth: bounded('flute.embouchureHoleWidth', 'embouchureHoleWidth', {
		label: 'Hole Width',
		tooltip: 'Width of the embouchure hole. Together with length, it determines the opening area.',
		unit: 'mm', input: 'number', step: 0.5,
		defaultSource: { kind: 'legacy-default', key: 'embouchureHoleWidth' }
	}),
	lipCoveragePercent: bounded('flute.lipCoveragePercent', 'lipCoveragePercent', {
		label: 'Lip Coverage',
		tooltip: 'Percentage of the embouchure hole covered by the player’s lips.',
		unit: '%', input: 'number', step: 1, visibility: 'advanced',
		defaultSource: { kind: 'legacy-default', key: 'lipCoveragePercent' }
	}),
	embouchureDistance: field('flute.embouchureDistance', {
		label: 'Embouchure Distance',
		tooltip: 'Calculated distance from the flute base to the embouchure center.',
		unit: 'mm', input: 'display',
		defaultSource: { kind: 'acoustic-calculation' },
		readOnly: true, derived: true, dependencies: acousticDependencies
	}),
	fluteLength: field('flute.fluteLength', {
		label: 'Flute Length',
		tooltip: 'Calculated overall acoustic flute length.',
		unit: 'mm', input: 'display',
		defaultSource: { kind: 'acoustic-calculation' },
		readOnly: true, derived: true, dependencies: acousticDependencies,
		validate: validateLength
	}),
	numberOfToneHoles: bounded('flute.numberOfToneHoles', 'numberOfToneHoles', {
		label: 'Number of Tone Holes',
		tooltip: 'Number of finger holes used to play different notes.',
		unit: ' holes', input: 'slider', step: 1,
		defaultSource: { kind: 'legacy-default', key: 'numberOfToneHoles' }
	}),
	fundamentalFrequency: bounded('flute.fundamentalFrequency', 'fundamentalFrequency', {
		label: 'Fundamental Frequency',
		tooltip: 'The lowest pitch produced with all holes closed; it determines the instrument key and range.',
		unit: 'Hz', input: 'frequency', step: 0.1,
		defaultSource: { kind: 'legacy-default', key: 'fundamentalFrequency' }
	}),
	toneHoleFilletRadius: bounded('flute.toneHoleFilletRadius', 'toneHoleFilletRadius', {
		label: 'Tone Hole Fillet Radius',
		tooltip: 'Radius of the rounded edge applied to tone holes for printing and comfort.',
		unit: 'mm', input: 'number', step: 0.1,
		defaultSource: { kind: 'legacy-default', key: 'toneHoleFilletRadius' }
	}),
	connectorLength: bounded('flute.connectorLength', 'connectorLength', {
		label: 'Connector Length',
		tooltip: 'Length of connector pieces used to join printed flute sections.',
		unit: 'mm', input: 'number', step: 1,
		defaultSource: { kind: 'legacy-default', key: 'connectorLength' }
	}),
	numberOfCuts: bounded('flute.numberOfCuts', 'numberOfCuts', {
		label: 'Number of Cuts',
		tooltip: 'Number of cuts used to divide the flute into printable sections.',
		unit: ' cuts', input: 'slider', step: 1,
		defaultSource: { kind: 'legacy-default', key: 'numberOfCuts' }
	}),
	cutDistances: bounded('flute.cutDistances', 'cutDistance', {
		label: 'Cut Distance',
		tooltip: 'Distance from the flute base to a cut location.',
		unit: 'mm', input: 'number', step: 1,
		defaultSource: { kind: 'zero' },
		dependencies: [
			'flute.connectorLength',
			'flute.embouchureDistance',
			'flute.embouchureHoleLength',
			'flute.fluteLength',
			'flute.cutDistances'
		],
		validate: (value, context) =>
			context
				? validateCutDistance(
				value,
				context.index ?? 0,
				context.design.flute.cutDistances,
				context.design.flute.connectorLength,
				context.design.flute.embouchureDistance,
				context.design.flute.embouchureHoleLength,
				context.design.flute.fluteLength
			)
				: { status: 'success' }
	})
} satisfies FluteFieldSchemaMap;

export const TONE_HOLE_FIELDS = {
	holeDiameters: bounded('toneHoles.holeDiameters.${number}', 'holeDiameter', {
		label: 'Diameter',
		tooltip: 'The tone-hole diameter. Larger holes produce a louder sound and affect tuning.',
		unit: 'mm', input: 'number', step: 0.5,
		defaultSource: { kind: 'legacy-default', key: 'holeDiameters' },
		validate: validateDiameter
	}),
	holeCents: bounded('toneHoles.holeCents.${number}', 'holeCents', {
		label: 'Pitch',
		tooltip: 'Pitch in cents above the fundamental when this hole is open.',
		unit: 'cents', input: 'number', step: 1, visibility: 'advanced',
		defaultSource: { kind: 'diatonic-scale' },
		dependencies: ['flute.fundamentalFrequency']
	}),
	holeDistances: field('toneHoles.holeDistances.${number}', {
		label: 'Distance',
		tooltip: 'Calculated distance from the flute base to the center of this tone hole.',
		unit: 'mm', input: 'display',
		defaultSource: { kind: 'acoustic-calculation' },
		readOnly: true, derived: true, dependencies: acousticDependencies
	}),
	cutoffRatios: field('toneHoles.cutoffRatios.${number}', {
		label: 'Cutoff Ratio',
		tooltip: 'Calculated ratio of cutoff frequency to target-note frequency.',
		input: 'display', visibility: 'advanced',
		defaultSource: { kind: 'acoustic-calculation' },
		readOnly: true, derived: true,
		dependencies: [
			'flute.boreDiameter',
			'flute.wallThickness',
			'flute.fundamentalFrequency',
			'flute.numberOfToneHoles'
		]
	})
} satisfies ToneHoleFieldSchemaMap;

export const TONE_HOLE_NUMBER_COLUMN = {
	label: 'Hole',
	tooltip: 'Hole number counting from the first tone hole closest to the embouchure.',
	unit: '',
	visibility: 'always'
} as const;

export const TONE_HOLE_COLUMNS = [
	{ key: 'number', ...TONE_HOLE_NUMBER_COLUMN },
	{ key: 'diameter', ...TONE_HOLE_FIELDS.holeDiameters },
	{ key: 'pitch', ...TONE_HOLE_FIELDS.holeCents },
	{ key: 'distance', ...TONE_HOLE_FIELDS.holeDistances },
	{ key: 'cutoff', ...TONE_HOLE_FIELDS.cutoffRatios }
] as const;

export const DESIGN_FIELDS = [...Object.values(FLUTE_FIELDS), ...Object.values(TONE_HOLE_FIELDS)];

export function toneHoleParameterPath(
	key: ToneHoleArrayKey,
	index: number
): DesignParameterPath {
	return `toneHoles.${key}.${index}`;
}

export function isFieldVisible(
	schema: ParameterFieldSchema,
	design: DesignDraft,
	view: 'basic' | 'advanced'
): boolean {
	if (schema.visibility !== 'always' && schema.visibility !== view) return false;
	if (!schema.visibleWhen) return true;
	const [group, key] = schema.visibleWhen.path.split('.') as ['flute', keyof FluteParameters];
	return group === 'flute' && design.flute[key] === schema.visibleWhen.equals;
}
