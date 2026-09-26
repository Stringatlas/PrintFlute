import { get, type Readable } from 'svelte/store';
import { describe, expect, it } from 'vitest';
import type {
	ApiResult,
	EvaluateDesignRequest,
	GenerationApi,
	ResolvedDesignSnapshot
} from '$lib/api/generation';
import { createDesignDraft, createResolvedSnapshot } from '$lib/api/generation/__fixtures__/design';
import { LocalGenerationApi } from '$lib/api/generation/local';
import { DesignController } from './designController';

function deferred<T>() {
	let resolve!: (value: T) => void;
	const promise = new Promise<T>((done) => {
		resolve = done;
	});
	return { promise, resolve };
}

function nextMatching<T>(store: Readable<T>, predicate: (value: T) => boolean): Promise<T> {
	return new Promise((resolve) => {
		let unsubscribe = () => {};
		unsubscribe = store.subscribe((value) => {
			if (!predicate(value)) return;
			unsubscribe();
			resolve(value);
		});
	});
}

describe('DesignController', () => {
	it('evaluates step-one edits and writes the resolved snapshot back', async () => {
		const controller = new DesignController(new LocalGenerationApi(), createDesignDraft());
		const snapshotPromise = nextMatching(
			controller.snapshot,
			(snapshot) => snapshot?.revision === 2
		);

		expect(controller.set('flute.boreDiameter', 15)).toBe(2);
		const snapshot = await snapshotPromise;

		expect(snapshot?.design.flute.boreDiameter).toBe(15);
		expect(get(controller.design)).toEqual(snapshot?.design);
		expect(get(controller.pending)).toBe(false);
	});

	it('publishes only the latest of rapid controlled evaluations', async () => {
		const requests: EvaluateDesignRequest[] = [];
		const responses = [
			deferred<ApiResult<ResolvedDesignSnapshot>>(),
			deferred<ApiResult<ResolvedDesignSnapshot>>()
		];
		const api: GenerationApi = {
			evaluate(request) {
				requests.push(request);
				return responses[requests.length - 1].promise;
			}
		};
		const controller = new DesignController(api, createDesignDraft(), {
			evaluateInitial: false
		});

		controller.set('flute.boreDiameter', 15);
		controller.set('flute.boreDiameter', 16);
		const latest = createResolvedSnapshot(2);
		latest.design.flute.boreDiameter = 16;
		responses[1].resolve({ ok: true, value: latest });
		await nextMatching(controller.snapshot, (snapshot) => snapshot?.revision === 2);

		const stale = createResolvedSnapshot(1);
		stale.design.flute.boreDiameter = 15;
		responses[0].resolve({ ok: true, value: stale });
		await Promise.resolve();

		expect(requests.map((request) => request.revision)).toEqual([1, 2]);
		expect(get(controller.snapshot)?.revision).toBe(2);
		expect(get(controller.design).flute.boreDiameter).toBe(16);
		expect(get(controller.pending)).toBe(false);
	});

	it('normalizes replace commands through the evaluated snapshot', async () => {
		const controller = new DesignController(
			new LocalGenerationApi(),
			createDesignDraft(),
			{ evaluateInitial: false }
		);
		const replacement = createDesignDraft();
		replacement.flute.boreDiameter = Number.NaN;
		replacement.flute.thumbHoleAngle = 999;
		const snapshotPromise = nextMatching(
			controller.snapshot,
			(snapshot) => snapshot?.revision === 1
		);

		controller.replace(replacement);
		const snapshot = await snapshotPromise;

		expect(snapshot?.design.flute.boreDiameter).toBe(14.3);
		expect(snapshot?.design.flute.thumbHoleAngle).toBe(90);
		expect(get(controller.error)).toBeNull();
	});
});
