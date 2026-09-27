import {
	DESIGN_SCHEMA_VERSION,
	fingerprintDesign,
	type ApiResult,
	type FluteParameters,
	type PreviewKind,
	type ResolvedDesignSnapshot,
	type ThreePreviewRequest,
	type ThreePreviewResult,
	type ThreePreviewService as ThreePreviewServiceContract,
	type ToneHoleParameters
} from '$lib/api/generation';
import { resolveComputedParameter } from '$lib/domain/computedParameters';
import { createHeadJointGeometry } from '$lib/geometry/preview/headjointGeometry';
import { createFullFluteGeometry } from '$lib/geometry/preview/fullFluteGeometry';
import { createPrintingFluteGeometry } from '$lib/geometry/preview/printingFluteGeometry';

function buildPreview(
	snapshot: ResolvedDesignSnapshot,
	previewKind: PreviewKind
): ThreePreviewResult {
	switch (previewKind) {
		case 'headjoint':
			return createHeadJointGeometry(snapshot);
		case 'full':
			return createFullFluteGeometry(snapshot);
		case 'printing':
			return createPrintingFluteGeometry(snapshot);
	}
}

function makeIdempotent(result: ThreePreviewResult): ThreePreviewResult {
	let disposed = false;
	return {
		root: result.root,
		dispose() {
			if (disposed) return;
			disposed = true;
			result.dispose();
		}
	};
}

/** Three.js implementation of the frozen preview boundary. */
export class ThreePreviewService implements ThreePreviewServiceContract {
	async build(request: ThreePreviewRequest): Promise<ApiResult<ThreePreviewResult>> {
		try {
			return {
				ok: true,
				value: makeIdempotent(buildPreview(request.snapshot, request.previewKind))
			};
		} catch (error) {
			return {
				ok: false,
				error: {
					code: 'PREVIEW_FAILED',
					message: error instanceof Error ? error.message : 'Three.js preview generation failed',
					retryable: true
				}
			};
		}
	}
}

export const threePreviewService: ThreePreviewServiceContract = new ThreePreviewService();

export function previewKindForStep(step: 1 | 2 | 3): PreviewKind {
	if (step === 2) return 'full';
	if (step === 3) return 'printing';
	return 'headjoint';
}

/**
 * Temporary adapter for callers which still own the legacy split parameter state.
 * New integration should pass the evaluator's ResolvedDesignSnapshot directly.
 */
export function createLegacyPreviewSnapshot(
	fluteParams: FluteParameters,
	toneHoleParams: ToneHoleParameters,
	revision = 0
): ResolvedDesignSnapshot {
	const design = {
		flute: { ...fluteParams, cutDistances: [...fluteParams.cutDistances] },
		toneHoles: {
			holeDiameters: [...toneHoleParams.holeDiameters],
			holeCents: [...toneHoleParams.holeCents],
			holeDistances: [...toneHoleParams.holeDistances],
			holeAngles: [...toneHoleParams.holeAngles],
			cutoffRatios: [...toneHoleParams.cutoffRatios]
		}
	};
	const corkDistance = resolveComputedParameter('corkDistance', design.flute);
	const corkThickness = resolveComputedParameter('corkThickness', design.flute);

	return {
		schemaVersion: DESIGN_SCHEMA_VERSION,
		revision,
		fingerprint: fingerprintDesign(design),
		design,
		resolved: { corkDistance, corkThickness },
		calculation: {
			data: {
				embouchurePhysicalPosition: design.flute.embouchureDistance,
				holes: design.toneHoles.holeDistances.map((physicalPosition, index) => ({
					frequency:
						design.flute.fundamentalFrequency *
						2 ** ((design.toneHoles.holeCents[index] ?? 0) / 1200),
					diameter: design.toneHoles.holeDiameters[index] ?? 0,
					acousticPosition: design.flute.fluteLength - physicalPosition,
					physicalPosition,
					cutoffFrequency: 0,
					spacing: 0
				})),
				acousticEndX: design.flute.fluteLength
			},
			updates: {
				embouchureDistance: design.flute.embouchureDistance,
				fluteLength: design.flute.fluteLength,
				holeDistances: [...design.toneHoles.holeDistances],
				cutoffRatios: [...design.toneHoles.cutoffRatios]
			}
		},
		tuning: { available: false, message: 'Tuning guidance has not been evaluated.', toneHoles: [] },
		validation: []
	};
}

/** @deprecated Pass a ThreePreviewRequest to threePreviewService.build instead. */
export function createGeometryForStep(
	step: 1 | 2 | 3,
	fluteParams: FluteParameters,
	toneHoleParams: ToneHoleParameters
) {
	const snapshot = createLegacyPreviewSnapshot(fluteParams, toneHoleParams);
	const result = makeIdempotent(buildPreview(snapshot, previewKindForStep(step)));
	return { group: result.root, dispose: result.dispose };
}
