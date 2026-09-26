import { describe, expect, it } from 'vitest';
import { createResolvedSnapshot } from '$lib/api/generation/__fixtures__/design';
import type { ProductionJobRequest } from '$lib/api/generation';
import { validCutDistances } from './fluteCAD';
import {
	ProductionJobState,
	productionCacheKey,
	productionOutputNames,
	validateProductionRequest,
	validateProductionResult
} from './production';

function request(): ProductionJobRequest {
	const snapshot = createResolvedSnapshot(4);
	return {
		jobId: 'cad-4',
		revision: snapshot.revision,
		fingerprint: snapshot.fingerprint,
		snapshot,
		artifact: { kind: 'mesh', scope: 'full' }
	};
}

describe('production request identity', () => {
	it('accepts a matching immutable snapshot', () => {
		expect(validateProductionRequest(request()).ok).toBe(true);
	});

	it('rejects revision and fingerprint mismatches as stale', () => {
		const wrongRevision = request();
		wrongRevision.revision += 1;
		const wrongFingerprint = request();
		wrongFingerprint.snapshot.design.flute.boreDiameter += 0.1;

		expect(validateProductionRequest(wrongRevision)).toMatchObject({
			ok: false,
			error: { code: 'STALE_JOB' }
		});
		expect(validateProductionRequest(wrongFingerprint)).toMatchObject({
			ok: false,
			error: { code: 'STALE_JOB' }
		});
	});

	it('rejects worker results carrying another job identity', () => {
		const build = request();
		expect(
			validateProductionResult(build, {
				jobId: 'another-job',
				revision: build.revision,
				fingerprint: build.fingerprint,
				artifact: { kind: 'mesh', parts: [] }
			})
		).toMatchObject({ ok: false, error: { code: 'STALE_JOB' } });
	});
});

describe('production cancellation and caching decisions', () => {
	it('cancels known jobs idempotently', () => {
		const state = new ProductionJobState();
		expect(state.cancel('missing')).toBe(false);
		state.begin('job');
		expect(state.cancel('job')).toBe(true);
		expect(state.cancel('job')).toBe(true);
		expect(state.isCancelled('job')).toBe(true);
	});

	it('keys output caching by format, scope, and mesh tolerances', () => {
		expect(productionCacheKey({ kind: 'step', scope: 'full', linearDeflection: 99 })).toBe(
			productionCacheKey({ kind: 'step', scope: 'full' })
		);
		expect(productionCacheKey({ kind: 'mesh', scope: 'full' })).not.toBe(
			productionCacheKey({ kind: 'mesh', scope: 'parts' })
		);
		expect(productionCacheKey({ kind: 'stl', scope: 'full', linearDeflection: 0.1 })).not.toBe(
			productionCacheKey({ kind: 'stl', scope: 'full', linearDeflection: 0.2 })
		);
	});
});

describe('production outputs', () => {
	it('uses deterministic full and part file names', () => {
		expect(productionOutputNames('stl', 'full', 3)).toEqual(['flute.stl']);
		expect(productionOutputNames('step', 'parts', 3)).toEqual([
			'flute-part-1.step',
			'flute-part-2.step',
			'flute-part-3.step'
		]);
	});

	it('derives part count from unique valid configured cuts only', () => {
		const cuts = validCutDistances([200, 100, 100, -1, 900], 4, 300);
		expect(cuts).toEqual([100, 200]);
		expect(cuts.length + 1).toBe(3);
		expect(validCutDistances([100, 200], 1, 300)).toEqual([100]);
	});
});
