import { FLUTE_FIELDS, TONE_HOLE_FIELDS } from '$lib/domain/designSchema';

/** @deprecated Read field help from the design schema. */
export const PARAMETER_INFO = {
	...Object.fromEntries(
		Object.entries(FLUTE_FIELDS).map(([key, schema]) => [key, schema.tooltip])
	),
	toneHoleDiameter: TONE_HOLE_FIELDS.holeDiameters.tooltip,
	toneHolePitch: TONE_HOLE_FIELDS.holeCents.tooltip,
	toneHoleDistance: TONE_HOLE_FIELDS.holeDistances.tooltip,
	toneHoleCutoffRatio: TONE_HOLE_FIELDS.cutoffRatios.tooltip,
	cutDistance: FLUTE_FIELDS.cutDistances.tooltip
} as const;
