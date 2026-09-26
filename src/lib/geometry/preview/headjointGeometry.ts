import * as THREE from 'three';
import { Brush, Evaluator, SUBTRACTION } from 'three-bvh-csg';
import type { ResolvedDesignSnapshot, ThreePreviewResult } from '$lib/api/generation';
import { createFluteMaterial } from './materials';
import { addLabel } from './sceneAnnotations';
import { getPreviewBodySemantics } from './bodySemantics';

// TODO: Use tube helper function to simplify geometry creation
const HEADJOINT_LENGTH_MM = 150;

export function createHeadJointGeometry(snapshot: ResolvedDesignSnapshot): ThreePreviewResult {
	const params = snapshot.design.flute;
	const semantics = getPreviewBodySemantics(snapshot);
	const group = new THREE.Group();
	const geometries: THREE.BufferGeometry[] = [];
	
	const innerRadius = params.boreDiameter / 2;
	const outerRadius = innerRadius + params.wallThickness;
	const headjointEnd = semantics.body.end.bodyDistance;
	const headjointStart = Math.max(0, headjointEnd - HEADJOINT_LENGTH_MM);
	const headjointLength = headjointEnd - headjointStart;
	const startX = semantics.body.start.previewX + headjointStart;
	const endX = semantics.body.end.previewX;
	
	const { material, dispose: disposeMaterial } = createFluteMaterial();
	
	const evaluator = new Evaluator();
	
	// Create outer cylinder brush
	const outerGeometry = new THREE.CylinderGeometry(
		outerRadius,
		outerRadius,
		headjointLength,
		32
	);
	outerGeometry.rotateZ(Math.PI / 2);
	outerGeometry.translate((startX + endX) / 2, 0, 0);
	const outerBrush = new Brush(outerGeometry);
	
	// Overshoot the open (body-side) face so CSG punches through the end cap.
	const boreCutOvershoot = Math.max(2, params.wallThickness);
	const mainBoreStartX = startX - boreCutOvershoot;
	const mainBoreEndX = semantics.mainBore.end.previewX;
	const mainBoreLength = mainBoreEndX - mainBoreStartX;
	const bore1Geometry = new THREE.CylinderGeometry(
		innerRadius,
		innerRadius,
		mainBoreLength,
		32
	);
	bore1Geometry.rotateZ(Math.PI / 2);
	bore1Geometry.translate((mainBoreStartX + mainBoreEndX) / 2, 0, 0);
	const bore1Brush = new Brush(bore1Geometry);
	
	// Bore from the far side of the cork to the tip of the overhang.
	const bore2Length = semantics.overhang.length;
	const bore2Geometry = new THREE.CylinderGeometry(
		innerRadius,
		innerRadius,
		bore2Length,
		32
	);
	bore2Geometry.rotateZ(Math.PI / 2);
	bore2Geometry.translate(
		(semantics.overhang.start.previewX + semantics.overhang.end.previewX) / 2,
		0,
		0
	);
	const bore2Brush = new Brush(bore2Geometry);
	
	// Subtract both bore sections
	let resultBrush = evaluator.evaluate(outerBrush, bore1Brush, SUBTRACTION);
	resultBrush = evaluator.evaluate(resultBrush, bore2Brush, SUBTRACTION);
	
	// Create embouchure hole elliptical cylinder
	const embouchureRadius = Math.max(params.embouchureHoleLength, params.embouchureHoleWidth) / 2;
	const embouchureGeometry = new THREE.CylinderGeometry(
		embouchureRadius,
		embouchureRadius,
		params.wallThickness * 2 + 1,
		32
	);
	// Scale to make it elliptical
	embouchureGeometry.scale(
		params.embouchureHoleLength / (embouchureRadius * 2),
		1,
		params.embouchureHoleWidth / (embouchureRadius * 2)
	);
	embouchureGeometry.translate(semantics.embouchure.previewX, outerRadius, 0);
	const embouchureBrush = new Brush(embouchureGeometry);
	
	// Subtract embouchure hole
	resultBrush = evaluator.evaluate(resultBrush, embouchureBrush, SUBTRACTION);
	
	const bodyMesh = new THREE.Mesh(resultBrush.geometry, material);
	group.add(bodyMesh);
	
	const titleLabel = addLabel(group, 'Headjoint Geometry', {
		x: (startX + endX) / 2,
		y: 0,
		z: outerRadius + 20
	}, { width: 50, height: 10 });
	
	geometries.push(outerGeometry, bore1Geometry, bore2Geometry, embouchureGeometry, resultBrush.geometry);
	
	let disposed = false;
	const dispose = () => {
		if (disposed) return;
		disposed = true;
		geometries.forEach(geo => geo.dispose());
		disposeMaterial();
		titleLabel.dispose();
	};
	
	return { root: group, dispose };
}