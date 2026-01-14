import * as THREE from 'three';
import { Brush, Evaluator, SUBTRACTION } from 'three-bvh-csg';
import type { FluteParameters } from '../stores/fluteStore';
import { resolveComputedParameter } from '$lib/components/generation/generation-steps/designParametersDefault';

const HEADJOINT_LENGTH_MM = 150;

interface HeadJointGeometryResult {
	group: THREE.Group;
	dispose: () => void;
}

export function createHeadJointGeometry(params: FluteParameters): HeadJointGeometryResult {
	const group = new THREE.Group();
	const geometries: THREE.BufferGeometry[] = [];
	
	const innerRadius = params.boreDiameter / 2;
	const outerRadius = innerRadius + params.wallThickness;
	const corkThickness = resolveComputedParameter('corkThickness', params);
	const corkDistance = resolveComputedParameter('corkDistance', params);
	const overhang = params.overhangLength;
	
	// Create layer line texture simulating 2mm 3D printing layers
	const canvas = document.createElement('canvas');
	canvas.width = 256;
	canvas.height = 256;
	const ctx = canvas.getContext('2d')!;
	
	// Base green
	ctx.fillStyle = '#10b981';
	ctx.fillRect(0, 0, 256, 256);
	
	const texture = new THREE.CanvasTexture(canvas);
	texture.wrapS = THREE.RepeatWrapping;
	texture.wrapT = THREE.RepeatWrapping;
	
	const material = new THREE.MeshStandardMaterial({
		map: texture,
		roughness: 0.4,
		metalness: 0.3,
	});
	
	const evaluator = new Evaluator();
	
	// Start at the top of headjoint
	const startPos = -HEADJOINT_LENGTH_MM / 2;
	const overhangEnd = startPos + overhang;
	const corkEnd = overhangEnd + corkThickness;
	const embouchurePos = corkEnd + corkDistance;
	
	// Create outer cylinder brush
	const outerGeometry = new THREE.CylinderGeometry(
		outerRadius,
		outerRadius,
		HEADJOINT_LENGTH_MM,
		32
	);
	outerGeometry.rotateZ(Math.PI / 2);
	const outerBrush = new Brush(outerGeometry);
	
	// Overhang cut
	const bore1Geometry = new THREE.CylinderGeometry(
		innerRadius,
		innerRadius,
		overhang,
		32
	);
	bore1Geometry.rotateZ(Math.PI / 2);
	bore1Geometry.translate(startPos + overhang / 2, 0, 0);
	const bore1Brush = new Brush(bore1Geometry);
	
	// Main bore cut
	const bore2Length = HEADJOINT_LENGTH_MM / 2 - corkEnd;
	const bore2Geometry = new THREE.CylinderGeometry(
		innerRadius,
		innerRadius,
		bore2Length,
		32
	);
	bore2Geometry.rotateZ(Math.PI / 2);
	bore2Geometry.translate(corkEnd + bore2Length / 2, 0, 0);
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
	embouchureGeometry.translate(embouchurePos, outerRadius, 0);
	const embouchureBrush = new Brush(embouchureGeometry);
	
	// Subtract embouchure hole
	resultBrush = evaluator.evaluate(resultBrush, embouchureBrush, SUBTRACTION);
	
	const bodyMesh = new THREE.Mesh(resultBrush.geometry, material);
	group.add(bodyMesh);
	
	geometries.push(outerGeometry, bore1Geometry, bore2Geometry, embouchureGeometry, resultBrush.geometry);
	
	const dispose = () => {
		geometries.forEach(geo => geo.dispose());
		material.dispose();
	};
	
	return { group, dispose };
}
