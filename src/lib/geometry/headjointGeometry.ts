import * as THREE from 'three';
import { Brush, Evaluator, SUBTRACTION } from 'three-bvh-csg';
import type { FluteParameters } from '../stores/fluteStore';

const HEADJOINT_LENGTH_MM = 150;

interface HeadJointGeometryResult {
	group: THREE.Group;
	dispose: () => void;
}

/**
 * Creates a hollow cylinder using CSG subtraction with cork wall and embouchure hole
 * Order: overhang (hollow) -> cork wall (solid) -> rest (hollow with embouchure)
 */
export function createHeadJointGeometry(params: FluteParameters): HeadJointGeometryResult {
	const group = new THREE.Group();
	const geometries: THREE.BufferGeometry[] = [];
	
	const innerRadius = params.boreDiameter / 2;
	const outerRadius = innerRadius + params.wallThickness;
	const corkThickness = params.corkThickness ?? 5;
	const corkDistance = params.corkDistance ?? 30; // Cork to embouchure center
	const overhang = params.overhangLength;
	
	// Create layer line texture simulating 2mm 3D printing layers
	const canvas = document.createElement('canvas');
	canvas.width = 256;
	canvas.height = 256;
	const ctx = canvas.getContext('2d')!;
	
	// Base green
	ctx.fillStyle = '#10b981';
	ctx.fillRect(0, 0, 256, 256);
	
	// Add visible horizontal layer lines (0.2mm spacing)
	// ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'; // Darker lines for visibility
	// for (let i = 0; i < 256; i += 4) {
	// 	ctx.fillRect(0, i, 256, 1);
	// }
	
	const texture = new THREE.CanvasTexture(canvas);
	texture.wrapS = THREE.RepeatWrapping;
	texture.wrapT = THREE.RepeatWrapping;
    
	// texture.repeat.set(1, HEADJOINT_LENGTH_MM / 0.2);
	
	const material = new THREE.MeshStandardMaterial({
		map: texture,
		roughness: 0.4,
		metalness: 0.3,
	});
	
	const evaluator = new Evaluator();
	
	// Positions along the flute (starting from -HEADJOINT_LENGTH_MM/2)
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
	
	// Create first bore section (overhang)
	const bore1Geometry = new THREE.CylinderGeometry(
		innerRadius,
		innerRadius,
		overhang,
		32
	);
	bore1Geometry.rotateZ(Math.PI / 2);
	bore1Geometry.translate(startPos + overhang / 2, 0, 0);
	const bore1Brush = new Brush(bore1Geometry);
	
	// Create second bore section (after cork to end)
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
	
	// Create embouchure hole (elliptical cylinder)
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
