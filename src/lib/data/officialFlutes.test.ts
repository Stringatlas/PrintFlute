import { describe, expect, it } from 'vitest';
import { LocalGenerationApi } from '$lib/api/generation/local';
import { OFFICIAL_FLUTES } from './officialFlutes';

describe('official flute catalog', () => {
	it('has stable unique identifiers', () => {
		expect(new Set(OFFICIAL_FLUTES.map((entry) => entry.id)).size).toBe(OFFICIAL_FLUTES.length);
		expect(new Set(OFFICIAL_FLUTES.map((entry) => entry.slug)).size).toBe(OFFICIAL_FLUTES.length);
	});

	it('contains only designs accepted by the local generation boundary', async () => {
		const api = new LocalGenerationApi();
		for (const [index, entry] of OFFICIAL_FLUTES.entries()) {
			const result = await api.evaluate({
				revision: index + 1,
				design: { flute: entry.fluteParameters, toneHoles: entry.toneHoleParameters }
			});
			expect(
				result.ok,
				`${entry.name} should be a valid design: ${result.ok ? '' : result.error.message}`
			).toBe(true);
		}
	});
});
