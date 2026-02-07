// @ts-nocheck
import { makeCylinder, drawEllipse } from "replicad";
import type { Solid } from "replicad";
import type { FluteParameters, ToneHoleParameters } from "../../stores/fluteStore";
import { resolveComputedParameter } from '$lib/components/generation/generation-steps/designParametersDefault';

export interface FluteCADResult {
	solid: Solid;
}

function createEllipticalHole(lengthX: number, widthY: number, depth: number): Solid {
	const majorRadius = Math.max(lengthX, widthY) / 2;
	const minorRadius = Math.min(lengthX, widthY) / 2;

	return drawEllipse(majorRadius, minorRadius)
		.sketchOnPlane("XY")
		.extrude(depth) as Solid;
}

export function createFluteCAD(fluteParams: FluteParameters, toneHoleParams: ToneHoleParameters): FluteCADResult {
	const innerRadius = fluteParams.boreDiameter / 2;
	const outerRadius = innerRadius + fluteParams.wallThickness;
	const corkThickness = resolveComputedParameter("corkThickness", fluteParams);
	const corkDistance = resolveComputedParameter("corkDistance", fluteParams);
	const overhang = fluteParams.overhangLength;
	const fluteLength = fluteParams.fluteLength;
	const embouchureDistance = fluteParams.embouchureDistance;
	const filletRadius = fluteParams.toneHoleFilletRadius;

	// Calculate positions from base (0 is at base, fluteLength is at top)
	const corkStart = embouchureDistance + corkDistance;
	const corkEnd = corkStart + corkThickness;
	const overhangStart = corkEnd + overhang;

	// Track hole positions (z-coordinates) for tone holes and thumb hole (excluding embouchure)
	const holePositions: number[] = [];

	// Create outer cylinder (the main flute body)
	// Replicad cylinders are created along Z axis by default
	let flute = makeCylinder(outerRadius, fluteLength);

	// Create main bore (from base to cork start)
	const bore1Length = corkStart;
	if (bore1Length > 0) {
		const bore1 = makeCylinder(innerRadius, bore1Length);
		flute = flute.cut(bore1);
	}

	// Create bore section after cork (from cork end to overhang start)
	const bore2Length = overhangStart - corkEnd;
	if (bore2Length > 0) {
		const bore2 = makeCylinder(innerRadius, bore2Length).translate([
			0,
			0,
			corkEnd,
		]);
		flute = flute.cut(bore2);
	}

	// Create embouchure hole (elliptical)
	const embouchureDepth = fluteParams.wallThickness * 2 + 1;
	const embouchureHole = createEllipticalHole(
		fluteParams.embouchureHoleLength,
		fluteParams.embouchureHoleWidth,
		embouchureDepth
	)
		.rotate(90, [0, 0, 0], [1, 0, 0])
		.translate([0, outerRadius, embouchureDistance]);

	flute = flute.cut(embouchureHole);

	// Add all tone holes
	for (let i = 0; i < fluteParams.numberOfToneHoles; i++) {
		const holeDiameter = toneHoleParams.holeDiameters[i] || 0;
		const holeDistance = toneHoleParams.holeDistances[i] || 0;

		if (holeDiameter > 0 && holeDistance > 0 && holeDistance < fluteLength) {
			const holeRadius = holeDiameter / 2;
			const holeDepth = fluteParams.wallThickness * 2 + 1;

			const toneHole = makeCylinder(holeRadius, holeDepth)
				.rotate(90, [0, 0, 0], [1, 0, 0])
				.translate([0, outerRadius, holeDistance]);

			flute = flute.cut(toneHole);
			holePositions.push(holeDistance);
		}
	}

	// Add thumb hole if enabled
	if (fluteParams.hasThumbHole && fluteParams.numberOfToneHoles >= 2) {
		const lastHoleDistance =
			toneHoleParams.holeDistances[fluteParams.numberOfToneHoles - 1] || 0;
		const secondLastHoleDistance =
			toneHoleParams.holeDistances[fluteParams.numberOfToneHoles - 2] || 0;
		const thumbHoleDistance = (lastHoleDistance + secondLastHoleDistance) / 2;

		if (thumbHoleDistance > 0 && thumbHoleDistance < fluteLength) {
			const thumbRadius = fluteParams.thumbHoleDiameter / 2;
			const thumbDepth = fluteParams.wallThickness * 2 + 1;

			// Convert angle to radians (0 = bottom opposite tone holes, 90 = side)
			const angleRad = (fluteParams.thumbHoleAngle * Math.PI) / 180;
			const yOffset = -Math.cos(angleRad) * outerRadius;
			const zOffset = -Math.sin(angleRad) * outerRadius;

			// Create thumb hole pointing radially inward at the correct angle
			const thumbHole = makeCylinder(thumbRadius, thumbDepth)
				.rotate(90, [0, 0, 0], [1, 0, 0])
				.rotate(-fluteParams.thumbHoleAngle, [0, 0, 0], [0, 0, 1])
				.translate([zOffset, yOffset, thumbHoleDistance]);

			flute = flute.cut(thumbHole);
			holePositions.push(thumbHoleDistance);
		}
	}

	// Apply fillets to tone holes and thumb hole edges
	// Note: Replicad's fillet API doesn't support selective edge filtering the same way as Three-BVH-CSG
	// For now, we skip fillets on the CAD model. Fillets can be applied in the final mesh generation.
	if (filletRadius > 0 && holePositions.length > 0) {
        flute = flute.fillet(filletRadius, (edge) => {
            try {
                const center = edge.center;
                if (!center) {
                    console.warn('Edge has no center property');
                    return false;
                }
                
                // Check if edge is on the outer surface (Y ≈ outerRadius or radially at outerRadius)
                const radialDist = Math.sqrt(center.x * center.x + center.y * center.y);
                const isOuterSurface = Math.abs(radialDist - outerRadius) < 0.1;
                
                // Check if edge Z-coordinate matches any hole position (with tolerance)
                const isAtHolePosition = holePositions.some(
                    pos => Math.abs(center.z - pos) < 0.5
                );

                return isOuterSurface && isAtHolePosition;
            } catch (edgeError) {
                console.error('Error filtering edge:', edgeError);
                return false;
            }
        });
	}

	// Center the geometry at origin (translate by -fluteLength/2 on Z axis)
	flute = flute.translate([0, 0, -fluteLength / 2]);

	// Rotate to match Three.js orientation (flute along X axis)
	flute = flute.rotate(90, [0, 0, 0], [0, 1, 0]);
    flute = flute.rotate(90, [0, 0, 0], [0, 0, 1]);

	return { solid: flute };
}
