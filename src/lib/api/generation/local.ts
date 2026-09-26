import { resolveComputedParameter } from '$lib/domain/computedParameters';
import {
	calculateFluteData,
	calculateFluteUpdates,
	type CalculatedFluteUpdates
} from '$lib/services/fluteCalculation';
import { normalizeDesignDraft } from '$lib/services/designNormalization';
import {
	validateDesign,
	type ValidationIssue as LegacyValidationIssue
} from '$lib/validation/designParameters';
import {
	DESIGN_SCHEMA_VERSION,
	type AcousticCalculation,
	type ApiResult,
	type DesignDraft,
	type DesignValidationIssue,
	type EvaluateDesignRequest,
	type GenerationApi,
	type ResolvedDesignSnapshot
} from './contracts';
import { fingerprintDesign } from './fingerprint';

type Calculate = typeof calculateFluteData;

function mapCalculation(result: ReturnType<Calculate>): AcousticCalculation {
	return {
		embouchurePhysicalPosition: result.embouchurePhysicalPosition,
		acousticEndX: result.acousticEndX,
		holes: result.holes.map((hole) => ({
			frequency: hole.frequency,
			diameter: hole.diameter,
			acousticPosition: hole.acousticPosition,
			physicalPosition: hole.physicalPosition,
			cutoffFrequency: hole.cutoffFrequency,
			spacing: hole.spacing
		}))
	};
}

function issuePath(path: string): string {
	if (path.startsWith('hole')) return `toneHoles.${path}`;
	return `flute.${path}`;
}

function mapIssue(issue: LegacyValidationIssue): DesignValidationIssue {
	return {
		path: issuePath(issue.path),
		severity: issue.status === 'error' ? 'error' : 'warning',
		code: issue.status === 'error' ? 'INVALID_DESIGN_PARAMETER' : 'DESIGN_WARNING',
		message: issue.message ?? 'Invalid design parameter'
	};
}

function applyUpdates(design: DesignDraft, updates: CalculatedFluteUpdates): DesignDraft {
	return {
		flute: {
			...design.flute,
			cutDistances: [...design.flute.cutDistances],
			embouchureDistance: updates.embouchureDistance,
			fluteLength: updates.fluteLength
		},
		toneHoles: {
			...design.toneHoles,
			holeDiameters: [...design.toneHoles.holeDiameters],
			holeCents: [...design.toneHoles.holeCents],
			holeDistances: [...updates.holeDistances],
			cutoffRatios: [...updates.cutoffRatios]
		}
	};
}

/**
 * In-process implementation of the frozen generation boundary.
 *
 * It has no store dependencies and never mutates the request.
 */
export class LocalGenerationApi implements GenerationApi {
	constructor(private readonly calculate: Calculate = calculateFluteData) {}

	async evaluate(
		request: EvaluateDesignRequest
	): Promise<ApiResult<ResolvedDesignSnapshot>> {
		const normalized = normalizeDesignDraft(request.design);
		let rawCalculation: ReturnType<Calculate>;

		try {
			rawCalculation = this.calculate(normalized.flute, normalized.toneHoles);
		} catch (error) {
			return {
				ok: false,
				error: {
					code: 'CALCULATION_FAILED',
					message:
						error instanceof Error ? error.message : 'The acoustic calculation failed',
					retryable: false
				}
			};
		}

		const updates = calculateFluteUpdates(
			rawCalculation,
			normalized.flute.numberOfToneHoles,
			normalized.flute,
			normalized.toneHoles
		);
		const design = applyUpdates(normalized, updates);
		const issues = validateDesign(design.flute, design.toneHoles).map(mapIssue);
		const errors = issues.filter((issue) => issue.severity === 'error');

		if (errors.length > 0) {
			return {
				ok: false,
				error: {
					code: 'VALIDATION_FAILED',
					message: 'The resolved design is invalid',
					issues
				}
			};
		}

		const snapshot: ResolvedDesignSnapshot = {
			schemaVersion: DESIGN_SCHEMA_VERSION,
			revision: request.revision,
			fingerprint: fingerprintDesign(design),
			design,
			resolved: {
				corkDistance: resolveComputedParameter('corkDistance', design.flute),
				corkThickness: resolveComputedParameter('corkThickness', design.flute)
			},
			calculation: {
				data: mapCalculation(rawCalculation),
				updates
			},
			validation: issues
		};

		return { ok: true, value: snapshot };
	}
}

export const localGenerationApi: GenerationApi = new LocalGenerationApi();
