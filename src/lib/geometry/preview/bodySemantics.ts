import type { ResolvedDesignSnapshot } from '$lib/api/generation';

export interface PreviewAxisPosition {
	bodyDistance: number;
	previewX: number;
}

export interface PreviewSegmentBounds {
	start: PreviewAxisPosition;
	end: PreviewAxisPosition;
	length: number;
}

export interface PreviewHolePosition extends PreviewAxisPosition {
	index: number;
	diameter: number;
}

export interface PreviewBodySemantics {
	body: PreviewSegmentBounds;
	mainBore: PreviewSegmentBounds;
	cork: PreviewSegmentBounds;
	overhang: PreviewSegmentBounds;
	embouchure: PreviewAxisPosition;
	toneHoles: PreviewHolePosition[];
	cuts: PreviewAxisPosition[];
}

/** Maps distances measured from the flute base onto Three.js' positive X axis. */
export function bodyDistanceToPreviewX(bodyDistance: number, fluteLength: number): number {
	return bodyDistance - fluteLength / 2;
}

function position(bodyDistance: number, fluteLength: number): PreviewAxisPosition {
	return {
		bodyDistance,
		previewX: bodyDistanceToPreviewX(bodyDistance, fluteLength)
	};
}

function segment(start: number, end: number, fluteLength: number): PreviewSegmentBounds {
	return {
		start: position(start, fluteLength),
		end: position(end, fluteLength),
		length: end - start
	};
}

/**
 * Projects resolved design scalars into the coordinate convention shared by all
 * Three.js previews. Inputs are expected to have passed generation validation.
 */
export function getPreviewBodySemantics(snapshot: ResolvedDesignSnapshot): PreviewBodySemantics {
	const { flute, toneHoles } = snapshot.design;
	const fluteLength = flute.fluteLength;
	const embouchureDistance = flute.embouchureDistance;
	const corkStart = embouchureDistance + snapshot.resolved.corkDistance;
	const corkEnd = corkStart + snapshot.resolved.corkThickness;

	return {
		body: segment(0, fluteLength, fluteLength),
		mainBore: segment(0, corkStart, fluteLength),
		cork: segment(corkStart, corkEnd, fluteLength),
		overhang: segment(corkEnd, fluteLength, fluteLength),
		embouchure: position(embouchureDistance, fluteLength),
		toneHoles: toneHoles.holeDistances
			.slice(0, flute.numberOfToneHoles)
			.map((distance, index) => ({
				...position(distance, fluteLength),
				index,
				diameter: toneHoles.holeDiameters[index] ?? 0
			})),
		cuts: flute.cutDistances
			.slice(0, flute.numberOfCuts)
			.map((distance) => position(distance, fluteLength))
	};
}
