import * as THREE from 'three';
import { Brush, Evaluator, SUBTRACTION } from 'three-bvh-csg';
import type { FluteParameters, ToneHoleParameters } from '../../stores/fluteStore';
import { resolveComputedParameter } from '$lib/components/generation/generation-steps/designParametersDefault';
import { createFluteMaterial } from './materials';
import { addLabel } from './sceneAnnotations';

interface FullFluteGeometryResult {
	group: THREE.Group;
	dispose: () => void;
}
// TODO: Use tube helper function to simplify geometry creation

export function createFullFluteGeometry(
	fluteParams: FluteParameters,
	toneHoleParams: ToneHoleParameters
): FullFluteGeometryResult {
	const group = new THREE.Group();
	const geometries: THREE.BufferGeometry[] = [];
	
	const innerRadius = fluteParams.boreDiameter / 2;
	const outerRadius = innerRadius + fluteParams.wallThickness;
	const corkThickness = resolveComputedParameter('corkThickness', fluteParams);
	const corkDistance = resolveComputedParameter('corkDistance', fluteParams);
	const overhang = fluteParams.overhangLength;
	const fluteLength = fluteParams.fluteLength;
	const embouchureDistance = fluteParams.embouchureDistance;
	
    const titleLabel = addLabel(group, 'Full Flute Geometry', {
        x: 0,
        y: 0,
        z: outerRadius + 20
    }, { width: 50, height: 10 });
        
	const { material, dispose: disposeMaterial } = createFluteMaterial();
	
	const evaluator = new Evaluator();
	
	// Reference from BASE of flute (0 is at base, fluteLength is at top)
	// Center the geometry at origin for Three.js
	const centerOffset = -fluteLength / 2;
	
	// Calculate positions from base
	const corkStart = embouchureDistance + corkDistance;
	const corkEnd = corkStart + corkThickness;
    const overhangStart = corkEnd + overhang;
	
	// Create outer cylinder brush
	const outerGeometry = new THREE.CylinderGeometry(
		outerRadius,
		outerRadius,
		fluteLength,
		32
	);
	outerGeometry.rotateZ(Math.PI / 2);
	const outerBrush = new Brush(outerGeometry);
	
	// Create main bore (from base to cork start)
	const bore1Length = corkStart;
	const bore1Geometry = new THREE.CylinderGeometry(
		innerRadius,
		innerRadius,
		bore1Length,
		32
	);
	bore1Geometry.rotateZ(Math.PI / 2);
	bore1Geometry.translate(centerOffset + bore1Length / 2, 0, 0);
	const bore1Brush = new Brush(bore1Geometry);
	
	// Create bore section after cork (from cork end to overhang start)
	const bore2Length = overhangStart - corkEnd;
	const bore2Geometry = new THREE.CylinderGeometry(
		innerRadius,
		innerRadius,
		bore2Length,
		32
	);
	bore2Geometry.rotateZ(Math.PI / 2);
	bore2Geometry.translate(centerOffset + corkEnd + bore2Length / 2, 0, 0);
	const bore2Brush = new Brush(bore2Geometry);

	// Subtract all bore sections
	let resultBrush = evaluator.evaluate(outerBrush, bore1Brush, SUBTRACTION);
	resultBrush = evaluator.evaluate(resultBrush, bore2Brush, SUBTRACTION);
	
	// Create embouchure hole
	const embouchureRadius = Math.max(fluteParams.embouchureHoleLength, fluteParams.embouchureHoleWidth) / 2;
	const embouchureGeometry = new THREE.CylinderGeometry(
		embouchureRadius,
		embouchureRadius,
		fluteParams.wallThickness * 2 + 1,
		32
	);
	embouchureGeometry.scale(
		fluteParams.embouchureHoleLength / (embouchureRadius * 2),
		1,
		fluteParams.embouchureHoleWidth / (embouchureRadius * 2)
	);
	embouchureGeometry.translate(centerOffset + embouchureDistance, outerRadius, 0);
	const embouchureBrush = new Brush(embouchureGeometry);
	
	resultBrush = evaluator.evaluate(resultBrush, embouchureBrush, SUBTRACTION);
	
	geometries.push(outerGeometry, bore1Geometry, bore2Geometry, embouchureGeometry);
	
	// Add all tone holes
	for (let i = 0; i < fluteParams.numberOfToneHoles; i++) {
		const holeDiameter = toneHoleParams.holeDiameters[i] || 0;
		const holeDistance = toneHoleParams.holeDistances[i] || 0;
		
		if (holeDiameter > 0 && holeDistance > 0 && holeDistance < fluteLength) {
			const holeRadius = holeDiameter / 2;
			const holeGeometry = new THREE.CylinderGeometry(
				holeRadius,
				holeRadius,
				fluteParams.wallThickness * 2 + 1,
				32
			);
			holeGeometry.translate(centerOffset + holeDistance, outerRadius, 0);
			const holeBrush = new Brush(holeGeometry);
			
			resultBrush = evaluator.evaluate(resultBrush, holeBrush, SUBTRACTION);
			geometries.push(holeGeometry);
		}
	}
	
	// Add thumb hole if enabled
	if (fluteParams.hasThumbHole && fluteParams.numberOfToneHoles >= 2) {
		const lastHoleDistance = toneHoleParams.holeDistances[fluteParams.numberOfToneHoles - 1] || 0;
		const secondLastHoleDistance = toneHoleParams.holeDistances[fluteParams.numberOfToneHoles - 2] || 0;
		const thumbHoleDistance = (lastHoleDistance + secondLastHoleDistance) / 2;
		
		if (thumbHoleDistance > 0 && thumbHoleDistance < fluteLength) {
			const thumbRadius = fluteParams.thumbHoleDiameter / 2;
			const thumbHoleGeometry = new THREE.CylinderGeometry(
				thumbRadius,
				thumbRadius,
				fluteParams.wallThickness * 2 + 1,
				32
			);
			
			// Convert angle to radians (0 = bottom opposite tone holes, 90 = side)
			const angleRad = (fluteParams.thumbHoleAngle * Math.PI) / 180;
			const yOffset = -Math.cos(angleRad) * outerRadius;
			const zOffset = -Math.sin(angleRad) * outerRadius;
			
			// Rotate cylinder to point radially inward at the correct angle
			thumbHoleGeometry.rotateX(angleRad);
			thumbHoleGeometry.translate(centerOffset + thumbHoleDistance, yOffset, zOffset);
			
			const thumbHoleBrush = new Brush(thumbHoleGeometry);
			resultBrush = evaluator.evaluate(resultBrush, thumbHoleBrush, SUBTRACTION);
			geometries.push(thumbHoleGeometry);
		}
	}
	
	const bodyMesh = new THREE.Mesh(resultBrush.geometry, material);
	group.add(bodyMesh);
	geometries.push(resultBrush.geometry);
	
	const dispose = () => {
		geometries.forEach(geo => geo.dispose());
		disposeMaterial();
        titleLabel.dispose();
	};
	
	return { group, dispose };
}
