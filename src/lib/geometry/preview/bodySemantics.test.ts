import { describe, expect, it } from 'vitest';
import { createResolvedSnapshot } from '$lib/api/generation/__fixtures__/design';
import { bodyDistanceToPreviewX, getPreviewBodySemantics } from './bodySemantics';

describe('preview body semantics', () => {
	it('maps base distances monotonically onto the positive X axis', () => {
		expect(bodyDistanceToPreviewX(0, 300)).toBe(-150);
		expect(bodyDistanceToPreviewX(120, 300)).toBe(-30);
		expect(bodyDistanceToPreviewX(300, 300)).toBe(150);
	});

	it('derives resolved bore and cork segment bounds', () => {
		const snapshot = createResolvedSnapshot();
		const semantics = getPreviewBodySemantics(snapshot);
		const corkStart =
			snapshot.design.flute.embouchureDistance + snapshot.resolved.corkDistance;
		const corkEnd = corkStart + snapshot.resolved.corkThickness;

		expect(semantics.body.start.bodyDistance).toBe(0);
		expect(semantics.body.end.bodyDistance).toBe(snapshot.design.flute.fluteLength);
		expect(semantics.mainBore.end.bodyDistance).toBe(corkStart);
		expect(semantics.cork.start.bodyDistance).toBe(corkStart);
		expect(semantics.cork.end.bodyDistance).toBe(corkEnd);
		expect(semantics.overhang.start.bodyDistance).toBe(corkEnd);
		expect(semantics.overhang.end.bodyDistance).toBe(snapshot.design.flute.fluteLength);
	});

	it('projects resolved embouchure, tone-hole, and cut positions', () => {
		const snapshot = createResolvedSnapshot();
		snapshot.design.toneHoles.holeDistances[0] = 240;
		snapshot.design.flute.cutDistances = [175];
		const semantics = getPreviewBodySemantics(snapshot);
		const halfLength = snapshot.design.flute.fluteLength / 2;

		expect(semantics.embouchure.previewX).toBe(
			snapshot.design.flute.embouchureDistance - halfLength
		);
		expect(semantics.toneHoles[0]).toMatchObject({
			index: 0,
			bodyDistance: 240,
			previewX: 240 - halfLength,
			diameter: snapshot.design.toneHoles.holeDiameters[0]
		});
		expect(semantics.cuts[0]).toEqual({
			bodyDistance: 175,
			previewX: 175 - halfLength
		});
	});
});
