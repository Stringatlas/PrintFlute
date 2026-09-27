import { describe, expect, expectTypeOf, it } from 'vitest';
import { calculateFluteData, calculateFluteUpdates } from '$lib/services/fluteCalculation';
import { resolveComputedParameter } from '$lib/domain/computedParameters';
import { normalizeFluteParameters } from '$lib/stores/fluteStore';
import {
	DEFAULT_FLUTE_PARAMETERS,
	DEFAULT_TONE_HOLE_PARAMETERS
} from '$lib/services/designNormalization';
import { validateDesign } from '$lib/validation/designParameters';
import {
	API_ERROR_CODES,
	canonicalJson,
	fingerprintDesign,
	type ApiResult,
	type DesignCommand,
	type GenerationApi,
	type ProductionJobRequest,
	type ReplicadProductionService,
	type ResolvedDesignSnapshot,
	type ThreePreviewService
} from '.';
import { createDesignDraft, createResolvedSnapshot } from './__fixtures__/design';

describe('generation contract', () => {
	it('keeps compatibility types usable while resolving auto/manual values', () => {
		const draft = createDesignDraft();

		expect(resolveComputedParameter('corkDistance', draft.flute)).toBe(7.61);
		expect(resolveComputedParameter('corkThickness', draft.flute)).toBe(4);
	});

	it('normalizes legacy flute input before it enters the boundary', () => {
		const normalized = normalizeFluteParameters({
			boreDiameter: Number.NaN,
			numberOfToneHoles: 99,
			numberOfCuts: 2,
			cutDistances: [-10, 900],
			corkDistance: { mode: 'manual', value: 500 }
		});

		expect(normalized.boreDiameter).toBe(14.3);
		expect(normalized.numberOfToneHoles).toBe(8);
		expect(normalized.cutDistances).toEqual([0, 500]);
		expect(normalized.corkDistance).toEqual({ mode: 'manual', value: 30 });
	});

	it('supports acoustic calculation and derived update fixtures', () => {
		const draft = createDesignDraft();
		const calculation = calculateFluteData(draft.flute, draft.toneHoles);
		const updates = calculateFluteUpdates(
			calculation,
			draft.flute.numberOfToneHoles,
			draft.flute,
			draft.toneHoles
		);

		expect(calculation.holes).toHaveLength(6);
		expect(updates.embouchureDistance).toBeGreaterThan(0);
		expect(updates.fluteLength).toBeGreaterThan(updates.embouchureDistance);
		expect(updates.holeDistances.slice(0, 6).every(Number.isFinite)).toBe(true);
	});

	it('starts new designs at the recommended tone-hole positions', () => {
		const recommendation = calculateFluteData(
			DEFAULT_FLUTE_PARAMETERS,
			DEFAULT_TONE_HOLE_PARAMETERS
		).holes.map((hole) => hole.physicalPosition);

		expect(DEFAULT_TONE_HOLE_PARAMETERS.holeDistances.slice(0, recommendation.length))
			.toEqual(recommendation);
	});

	it('carries validation issues separately from calculation output', () => {
		const draft = createDesignDraft();
		draft.flute.wallThickness = 1;
		const issues = validateDesign(draft.flute, draft.toneHoles);

		expect(issues).toContainEqual({
			path: 'wallThickness',
			status: 'error',
			message: 'Too thin, structural integrity at risk'
		});
	});

	it('round-trips a resolved snapshot as serializable data', () => {
		const snapshot = createResolvedSnapshot(7);
		const roundTrip = JSON.parse(JSON.stringify(snapshot)) as ResolvedDesignSnapshot;

		expect(roundTrip).toEqual(snapshot);
		expect(roundTrip.revision).toBe(7);
	});

	it('exposes the expected compile-time service and command shapes', () => {
		expectTypeOf<GenerationApi['evaluate']>().toBeFunction();
		expectTypeOf<ThreePreviewService['build']>().toBeFunction();
		expectTypeOf<ReplicadProductionService['build']>().toBeFunction();

		const command = {
			type: 'set',
			path: 'toneHoles.holeDiameters.2',
			value: 7.25
		} satisfies DesignCommand;
		const request = {
			jobId: 'job-1',
			revision: 3,
			fingerprint: createResolvedSnapshot(3).fingerprint,
			snapshot: createResolvedSnapshot(3),
			artifact: { kind: 'step', scope: 'parts' }
		} satisfies ProductionJobRequest;

		expect(command.path).toBe('toneHoles.holeDiameters.2');
		expect(request.artifact.kind).toBe('step');
	});

	it('uses a discriminated result and stable error vocabulary', () => {
		const result: ApiResult<number> = {
			ok: false,
			error: { code: 'STALE_JOB', message: 'Superseded by revision 4' }
		};
		const unwrap = (candidate: ApiResult<number>) =>
			candidate.ok ? candidate.value : candidate.error.code;

		expect(unwrap(result)).toBe('STALE_JOB');
		expect(API_ERROR_CODES).toEqual([
			'VALIDATION_FAILED',
			'CALCULATION_FAILED',
			'PREVIEW_FAILED',
			'CAD_INIT_FAILED',
			'CAD_BUILD_FAILED',
			'CAD_EXPORT_FAILED',
			'CANCELLED',
			'STALE_JOB',
			'STORAGE_FAILED'
		]);
	});
});

describe('design fingerprint', () => {
	it('is independent of object key insertion order', () => {
		expect(canonicalJson({ b: 2, nested: { z: 1, a: 3 }, a: 1 })).toBe(
			canonicalJson({ a: 1, nested: { a: 3, z: 1 }, b: 2 })
		);
	});

	it('is deterministic, revision-independent, and sensitive to design changes', () => {
		const draft = createDesignDraft();
		const first = fingerprintDesign(draft);
		const second = fingerprintDesign(JSON.parse(JSON.stringify(draft)));
		const snapshot = createResolvedSnapshot(99);

		expect(first).toBe(second);
		expect(snapshot.fingerprint).toBe(fingerprintDesign(snapshot.design));
		draft.flute.boreDiameter += 0.01;
		expect(fingerprintDesign(draft)).not.toBe(first);
	});

	it('rejects values that are not valid finite DTO data', () => {
		expect(() => canonicalJson({ value: Number.POSITIVE_INFINITY })).toThrow(/non-finite/);
	});
});
