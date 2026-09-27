import { resolveComputedParameter } from '$lib/domain/computedParameters';
import {
	calculateFluteData,
	calculateFluteUpdates,
	type CalculatedFluteUpdates
} from '$lib/services/fluteCalculation';
import { normalizeDesignDraft } from '$lib/services/designNormalization';
import {
	PARAMETER_BOUNDS,
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
	type ToneHoleTuningAdvisory,
	type ResolvedDesignSnapshot
} from './contracts';
import { fingerprintDesign } from './fingerprint';

type Calculate = typeof calculateFluteData;

function fallbackBodyCalculation(
	flute: DesignDraft['flute']
): ReturnType<Calculate> {
	const speedOfSound = 345_000;
	const embouchureDiameter = Math.sqrt(
		(flute.embouchureHoleLength * flute.embouchureHoleWidth * 4) / Math.PI
	);
	const adjustedEmbouchure = Math.max(
		0.001,
		embouchureDiameter * (1 - 0.01 * flute.lipCoveragePercent)
	);
	const acousticEndX =
		(speedOfSound * 0.5) / flute.fundamentalFrequency - 0.30665 * flute.boreDiameter;
	const boreToEmbouchure = flute.boreDiameter / adjustedEmbouchure;
	const embouchureCorrection =
		boreToEmbouchure * boreToEmbouchure *
		(flute.boreDiameter / 2 + flute.wallThickness + 0.6133 * adjustedEmbouchure / 2);

	return {
		embouchurePhysicalPosition: Math.max(0, acousticEndX - embouchureCorrection),
		acousticEndX,
		holes: []
	};
}

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
			holeDistances: [...design.toneHoles.holeDistances],
			holeAngles: [...design.toneHoles.holeAngles],
			holeCents: [...design.toneHoles.holeCents],
			cutoffRatios: [...updates.cutoffRatios]
		}
	};
}

function suggestDiameter(
	design: DesignDraft,
	index: number,
	currentPosition: number,
	calculate: Calculate
): number | undefined {
	if (currentPosition <= 0) return undefined;
	const currentDiameter = design.toneHoles.holeDiameters[index];
	const baselineError = Math.abs(
		(currentPosition - calculate(design.flute, design.toneHoles).holes[index].physicalPosition)
	);
	const maximum = Math.min(
		PARAMETER_BOUNDS.holeDiameter.max,
		design.flute.boreDiameter * 0.89
	);
	let best: { diameter: number; error: number } | undefined;
	const testDiameter = (diameter: number) => {
		try {
			const holeDiameters = [...design.toneHoles.holeDiameters];
			holeDiameters[index] = diameter;
			const result = calculate(design.flute, { ...design.toneHoles, holeDiameters });
			const error = Math.abs((result.holes[index]?.physicalPosition ?? Infinity) - currentPosition);
			if (!best || error < best.error) best = { diameter, error };
		} catch {
			// Some diameters have no physical solution; they are not valid suggestions.
		}
	};

	for (let diameter = PARAMETER_BOUNDS.holeDiameter.min; diameter <= maximum; diameter += 0.1) {
		testDiameter(diameter);
	}
	if (best) {
		const refinementStart = Math.max(PARAMETER_BOUNDS.holeDiameter.min, best.diameter - 0.1);
		const refinementEnd = Math.min(maximum, best.diameter + 0.1);
		for (let diameter = refinementStart; diameter <= refinementEnd; diameter += 0.01) {
			testDiameter(diameter);
		}
	}

	if (
		!best ||
		best.error >= baselineError - 0.5 ||
		Math.abs(best.diameter - currentDiameter) < 0.125
	) return undefined;
	return Number(best.diameter.toFixed(2));
}

function tuningAnalysis(
	design: DesignDraft,
	calculation: ReturnType<Calculate>,
	calculate: Calculate
): ToneHoleTuningAdvisory[] {
	return calculation.holes.map((hole, index) => {
		const currentPosition = design.toneHoles.holeDistances[index] ?? 0;
		const suggestedPosition = hole.physicalPosition;
		const positionDelta = suggestedPosition - currentPosition;
		const idealLength = Math.max(0.001, calculation.acousticEndX - suggestedPosition);
		const currentLength = Math.max(0.001, calculation.acousticEndX - currentPosition);
		const estimatedCentsOffset = 1200 * Math.log2(idealLength / currentLength);
		const roundedCents = Math.round(estimatedCentsOffset);
		const status = Math.abs(estimatedCentsOffset) <= 10 ? 'in-tune' : 'warning';
		const direction = roundedCents > 0 ? 'sharp' : 'flat';
		const suggestedDiameter = status === 'warning'
			? suggestDiameter(design, index, currentPosition, calculate)
			: undefined;
		const diameterAlternative = suggestedDiameter === undefined
			? ''
			: ` Or try a ${suggestedDiameter.toFixed(2)} mm diameter while keeping this position.`;
		return {
			index,
			status,
			targetFrequency: hole.frequency,
			estimatedCentsOffset,
			currentPosition,
			suggestedPosition,
			positionDelta,
			suggestedDiameter,
			message: status === 'in-tune'
				? 'Placement is within 10 cents of the acoustic estimate.'
				: `Estimated ${Math.abs(roundedCents)} cents ${direction}. Suggested position: ${suggestedPosition.toFixed(1)} mm (${positionDelta >= 0 ? '+' : ''}${positionDelta.toFixed(1)} mm).${diameterAlternative}`
		};
	});
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
		let tuningError: string | undefined;

		try {
			rawCalculation = this.calculate(normalized.flute, normalized.toneHoles);
		} catch (error) {
			tuningError = error instanceof Error ? error.message : 'The acoustic calculation failed';
			rawCalculation = fallbackBodyCalculation(normalized.flute);
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
			tuning: {
				available: !tuningError,
				...(tuningError
					? { message: `Tuning guidance unavailable: ${tuningError}` }
					: {}),
				toneHoles: tuningError ? [] : tuningAnalysis(design, rawCalculation, this.calculate)
			},
			validation: issues
		};

		return { ok: true, value: snapshot };
	}
}

export const localGenerationApi: GenerationApi = new LocalGenerationApi();
