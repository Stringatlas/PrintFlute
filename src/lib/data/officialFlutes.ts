import type { FluteLibraryEntry } from '$lib/domain/library';
import type { FluteParameters, ToneHoleParameters } from '$lib/domain/fluteTypes';
import {
	DEFAULT_FLUTE_PARAMETERS,
	DEFAULT_TONE_HOLE_PARAMETERS
} from '$lib/services/designNormalization';

const PUBLISHED_AT = '2026-01-01T00:00:00.000Z';
const PRINT_FLUTE_AUTHOR = { id: 'print-flute', displayName: 'Print Flute' } as const;

type CatalogInput = Pick<
	FluteLibraryEntry,
	'slug' | 'name' | 'description' | 'featured' | 'metadata'
> & {
	flute: Partial<FluteParameters>;
	toneHoles?: Partial<ToneHoleParameters>;
};

function catalogEntry(input: CatalogInput): FluteLibraryEntry {
	return {
		id: `official:${input.slug}`,
		slug: input.slug,
		source: 'official',
		name: input.name,
		description: input.description,
		createdAt: PUBLISHED_AT,
		updatedAt: PUBLISHED_AT,
		version: 1,
		visibility: 'public',
		author: PRINT_FLUTE_AUTHOR,
		featured: input.featured,
		metadata: input.metadata,
		fluteParameters: {
			...DEFAULT_FLUTE_PARAMETERS,
			...input.flute,
			corkDistance: input.flute.corkDistance ?? { ...DEFAULT_FLUTE_PARAMETERS.corkDistance },
			corkThickness: input.flute.corkThickness ?? { ...DEFAULT_FLUTE_PARAMETERS.corkThickness },
			cutDistances: input.flute.cutDistances
				? [...input.flute.cutDistances]
				: [...DEFAULT_FLUTE_PARAMETERS.cutDistances]
		},
		toneHoleParameters: {
			...DEFAULT_TONE_HOLE_PARAMETERS,
			...input.toneHoles,
			holeDiameters: input.toneHoles?.holeDiameters
				? [...input.toneHoles.holeDiameters]
				: [...DEFAULT_TONE_HOLE_PARAMETERS.holeDiameters],
			holeCents: input.toneHoles?.holeCents
				? [...input.toneHoles.holeCents]
				: [...DEFAULT_TONE_HOLE_PARAMETERS.holeCents],
			holeDistances: input.toneHoles?.holeDistances
				? [...input.toneHoles.holeDistances]
				: [...DEFAULT_TONE_HOLE_PARAMETERS.holeDistances],
			holeAngles: input.toneHoles?.holeAngles
				? [...input.toneHoles.holeAngles]
				: [...DEFAULT_TONE_HOLE_PARAMETERS.holeAngles],
			cutoffRatios: [...DEFAULT_TONE_HOLE_PARAMETERS.cutoffRatios]
		}
	};
}

export const OFFICIAL_FLUTES: readonly FluteLibraryEntry[] = [
	catalogEntry({
		slug: 'balanced-d5',
		name: 'Balanced D5',
		description: 'A responsive, general-purpose flute and the best place to start.',
		featured: true,
		metadata: {
			key: 'D5', difficulty: 'beginner', printFormat: 'sectional', size: 'standard',
			character: 'Balanced', tags: ['starter', 'responsive', 'general purpose']
		},
		flute: { fundamentalFrequency: 587.33, boreDiameter: 14.3, numberOfCuts: 1, cutDistances: [180] }
	}),
	catalogEntry({
		slug: 'warm-c5',
		name: 'Warm C5',
		description: 'A slightly wider, longer flute with a rounder and more relaxed voice.',
		featured: true,
		metadata: {
			key: 'C5', difficulty: 'intermediate', printFormat: 'sectional', size: 'long',
			character: 'Warm', tags: ['warm', 'full', 'lower pitch']
		},
		flute: {
			fundamentalFrequency: 523.25, boreDiameter: 16, wallThickness: 2.6,
			embouchureHoleLength: 10.5, embouchureHoleWidth: 10, numberOfCuts: 1, cutDistances: [195]
		},
		toneHoles: { holeDiameters: [8, 8.5, 5.5, 6.5, 7, 6, 6.5, 6.5] }
	}),
	catalogEntry({
		slug: 'clear-e5',
		name: 'Clear E5',
		description: 'Compact and quick-speaking, with a focused tone for melodic playing.',
		featured: true,
		metadata: {
			key: 'E5', difficulty: 'beginner', printFormat: 'one-piece', size: 'compact',
			character: 'Clear', tags: ['compact', 'focused', 'responsive']
		},
		flute: {
			fundamentalFrequency: 659.25, boreDiameter: 13.2, wallThickness: 2.4,
			embouchureHoleLength: 9, embouchureHoleWidth: 8.7, numberOfCuts: 0, cutDistances: []
		},
		toneHoles: { holeDiameters: [7, 7.5, 5, 5.5, 6, 5, 5.5, 5.5] }
	}),
	catalogEntry({
		slug: 'compact-g5',
		name: 'Compact G5',
		description: 'A small, bright flute for quick prints and easy travel.',
		featured: true,
		metadata: {
			key: 'G5', difficulty: 'intermediate', printFormat: 'one-piece', size: 'compact',
			character: 'Bright', tags: ['small', 'bright', 'quick print']
		},
		flute: {
			fundamentalFrequency: 783.99, boreDiameter: 11.8, wallThickness: 2.2,
			embouchureHoleLength: 8, embouchureHoleWidth: 7.5, overhangLength: 16,
			numberOfCuts: 0, cutDistances: []
		},
		toneHoles: { holeDiameters: [6, 6.5, 4.5, 5, 5.5, 4.5, 5, 5] }
	}),
	catalogEntry({
		slug: 'simple-d5',
		name: 'Simple D5',
		description: 'A straightforward six-hole layout without a thumb hole.',
		featured: false,
		metadata: {
			key: 'D5', difficulty: 'beginner', printFormat: 'sectional', size: 'standard',
			character: 'Simple', tags: ['six hole', 'no thumb hole', 'starter']
		},
		flute: {
			fundamentalFrequency: 587.33, hasThumbHole: false, numberOfCuts: 1, cutDistances: [180]
		}
	}),
	catalogEntry({
		slug: 'performance-d5',
		name: 'Performance D5',
		description: 'A freer-blowing D flute with larger holes and a more assertive response.',
		featured: false,
		metadata: {
			key: 'D5', difficulty: 'experienced', printFormat: 'sectional', size: 'standard',
			character: 'Open', tags: ['larger holes', 'thumb hole', 'responsive']
		},
		flute: {
			fundamentalFrequency: 587.33, numberOfToneHoles: 6, boreDiameter: 14.6,
			numberOfCuts: 1, cutDistances: [180]
		},
		toneHoles: {
			holeDiameters: [8, 8.5, 5.5, 6.5, 7, 6, 6, 6],
			holeCents: [200, 400, 500, 700, 900, 1100, 1200, 1400]
		}
	})
] as const;

export function findOfficialFlute(slugOrId: string): FluteLibraryEntry | undefined {
	return OFFICIAL_FLUTES.find((flute) => flute.slug === slugOrId || flute.id === slugOrId);
}
