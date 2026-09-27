import { describe, expect, it } from 'vitest';
import { createDesignDraft } from './__fixtures__/design';
import { LocalGenerationApi } from './local';

describe('LocalGenerationApi', () => {
	it('preserves tone-hole geometry while replacing derived compatibility values', async () => {
		const api = new LocalGenerationApi();
		const firstDraft = createDesignDraft();
		const secondDraft = createDesignDraft();
		secondDraft.flute.embouchureDistance = 999_999;
		secondDraft.flute.fluteLength = 888_888;
		secondDraft.toneHoles.holeDistances.fill(777_777);
		secondDraft.toneHoles.cutoffRatios.fill(666_666);

		const first = await api.evaluate({ revision: 1, design: firstDraft });
		const second = await api.evaluate({ revision: 2, design: secondDraft });

		expect(first.ok).toBe(true);
		expect(second.ok).toBe(true);
		if (!first.ok || !second.ok) return;
		expect(second.value.fingerprint).not.toBe(first.value.fingerprint);
		expect(second.value.design.toneHoles.holeDistances).toEqual(Array(8).fill(10_000));
		expect(second.value.calculation.data).toEqual(first.value.calculation.data);
		expect(second.value.design.flute.fluteLength).not.toBe(888_888);
		expect(second.value.revision).toBe(2);
	});

	it('returns non-blocking tuning guidance without changing geometry', async () => {
		const api = new LocalGenerationApi();
		const draft = createDesignDraft();
		draft.toneHoles.holeDistances[0] = 120;

		const result = await api.evaluate({ revision: 1, design: draft });

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.design.toneHoles.holeDistances[0]).toBe(120);
		expect(result.value.tuning.toneHoles[0]).toMatchObject({
			index: 0,
			currentPosition: 120,
			status: 'warning'
		});
		expect(result.value.tuning.toneHoles[0].suggestedPosition).not.toBe(120);
	});

	it('keeps acoustic calculation failures in the optional tuning layer', async () => {
		const api = new LocalGenerationApi(() => {
			throw new Error('test acoustic failure');
		});

		const result = await api.evaluate({ revision: 1, design: createDesignDraft() });

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.tuning).toEqual({
			available: false,
			message: 'Tuning guidance unavailable: test acoustic failure',
			toneHoles: []
		});
		expect(result.value.design.flute.fluteLength).toBeGreaterThan(0);
	});

	it('maps resolved validation errors to contract issues', async () => {
		const api = new LocalGenerationApi();
		const draft = createDesignDraft();
		draft.flute.wallThickness = 1;

		const result = await api.evaluate({ revision: 1, design: draft });

		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error.code).toBe('VALIDATION_FAILED');
		expect(result.error.issues).toContainEqual({
			path: 'flute.wallThickness',
			severity: 'error',
			code: 'INVALID_DESIGN_PARAMETER',
			message: 'Too thin, structural integrity at risk'
		});
	});

	it('keeps warnings on a successful snapshot', async () => {
		const api = new LocalGenerationApi();
		const draft = createDesignDraft();
		draft.flute.wallThickness = 4.5;

		const result = await api.evaluate({ revision: 1, design: draft });

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.validation).toContainEqual({
			path: 'flute.wallThickness',
			severity: 'warning',
			code: 'DESIGN_WARNING',
			message: 'Thick walls may affect tone'
		});
	});

	it('resolves auto cork dependencies and preserves manual overrides', async () => {
		const api = new LocalGenerationApi();
		const automatic = createDesignDraft();
		automatic.flute.corkThickness = { mode: 'auto' };
		const manual = createDesignDraft();
		manual.flute.corkDistance = { mode: 'manual', value: 12 };
		manual.flute.corkThickness = { mode: 'manual', value: 3 };

		const automaticResult = await api.evaluate({ revision: 1, design: automatic });
		const manualResult = await api.evaluate({ revision: 2, design: manual });

		expect(automaticResult.ok && automaticResult.value.resolved).toEqual({
			corkDistance: 7.61,
			corkThickness: 5.72
		});
		expect(manualResult.ok && manualResult.value.resolved).toEqual({
			corkDistance: 12,
			corkThickness: 3
		});
	});

	it('normalizes replacement-shaped input before calculating', async () => {
		const api = new LocalGenerationApi();
		const draft = createDesignDraft();
		draft.flute.boreDiameter = Number.NaN;
		draft.flute.thumbHoleAngle = 999;
		draft.toneHoles.holeDiameters = [Number.NaN];

		const result = await api.evaluate({ revision: 3, design: draft });

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.design.flute.boreDiameter).toBe(14.3);
		expect(result.value.design.flute.thumbHoleAngle).toBe(90);
		expect(result.value.design.toneHoles.holeDiameters).toHaveLength(8);
	});
});
