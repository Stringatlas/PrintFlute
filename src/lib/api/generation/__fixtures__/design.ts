import {
	DESIGN_SCHEMA_VERSION,
	fingerprintDesign,
	type DesignDraft,
	type ResolvedDesignSnapshot
} from '..';

export function createDesignDraft(): DesignDraft {
	return {
		flute: {
			boreDiameter: 14.3,
			wallThickness: 2.5,
			hasThumbHole: true,
			thumbHoleDiameter: 6,
			thumbHoleAngle: 0,
			overhangLength: 20,
			corkDistance: { mode: 'auto' },
			corkThickness: { mode: 'manual', value: 4 },
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
			cutDistances: [180]
		},
		toneHoles: {
			holeDiameters: [7.5, 8, 5, 6, 6.5, 5.5, 6, 6],
			holeCents: [200, 400, 500, 700, 900, 1100, 1200, 1400],
			holeDistances: Array(8).fill(0),
			holeAngles: Array(8).fill(0),
			cutoffRatios: Array(8).fill(0)
		}
	};
}

export function createResolvedSnapshot(revision = 1): ResolvedDesignSnapshot {
	const design = createDesignDraft();
	const holeDistances = [256, 221, 201, 166, 129, 93, 0, 0];
	const cutoffRatios = [1.9, 1.8, 1.7, 1.6, 1.5, 1.4, 0, 0];
	const embouchureDistance = 280;
	const corkDistance = 7.61;
	const corkThickness = 4;
	const fluteLength = embouchureDistance + corkDistance + corkThickness + design.flute.overhangLength;

	design.flute.embouchureDistance = embouchureDistance;
	design.flute.fluteLength = fluteLength;
	design.toneHoles.holeDistances = holeDistances;
	design.toneHoles.cutoffRatios = cutoffRatios;

	return {
		schemaVersion: DESIGN_SCHEMA_VERSION,
		revision,
		fingerprint: fingerprintDesign(design),
		design,
		resolved: { corkDistance, corkThickness },
		calculation: {
			data: {
				embouchurePhysicalPosition: embouchureDistance,
				acousticEndX: 290,
				holes: holeDistances.slice(0, 6).map((physicalPosition, index) => ({
					frequency: design.flute.fundamentalFrequency * 2 ** (design.toneHoles.holeCents[index] / 1200),
					diameter: design.toneHoles.holeDiameters[index],
					acousticPosition: 290 - physicalPosition,
					physicalPosition,
					cutoffFrequency: 1200,
					spacing: 35
				}))
			},
			updates: { embouchureDistance, fluteLength, holeDistances, cutoffRatios }
		},
		tuning: { available: true, toneHoles: [] },
		validation: []
	};
}
