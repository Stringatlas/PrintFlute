import * as THREE from 'three';
import { Brush, Evaluator, SUBTRACTION } from 'three-bvh-csg';

const DEFAULT_RADIAL_SEGMENTS = 32;

type CylinderAxis = 'x' | 'y' | 'z';

export interface HollowCylinderGeometryOptions {
	outerRadius: number;
	innerRadius: number;
	length: number;
	radialSegments?: number;
	axis?: CylinderAxis;
	center?: THREE.Vector3;
}

function orientCylinder(geometry: THREE.CylinderGeometry, axis: CylinderAxis) {
	if (axis === 'x') {
		geometry.rotateZ(Math.PI / 2);
		return;
	}

	if (axis === 'z') {
		geometry.rotateX(Math.PI / 2);
	}
}

export function createTubeGeometry({
	outerRadius,
	innerRadius,
	length,
	radialSegments = DEFAULT_RADIAL_SEGMENTS,
	axis = 'y',
	center = new THREE.Vector3(0, 0, 0)
}: HollowCylinderGeometryOptions): THREE.BufferGeometry {
	if (innerRadius <= 0 || outerRadius <= 0 || length <= 0) {
		throw new Error('outerRadius, innerRadius, and length must be greater than 0');
	}

	if (innerRadius >= outerRadius) {
		throw new Error('innerRadius must be smaller than outerRadius');
	}

	if (radialSegments < 3) {
		throw new Error('radialSegments must be at least 3');
	}

	const outerGeometry = new THREE.CylinderGeometry(outerRadius, outerRadius, length, radialSegments);
	const innerGeometry = new THREE.CylinderGeometry(innerRadius, innerRadius, length + 2, radialSegments);

	orientCylinder(outerGeometry, axis);
	orientCylinder(innerGeometry, axis);

	outerGeometry.translate(center.x, center.y, center.z);
	innerGeometry.translate(center.x, center.y, center.z);

	const outerBrush = new Brush(outerGeometry);
	const innerBrush = new Brush(innerGeometry);
	const evaluator = new Evaluator();
	const result = evaluator.evaluate(outerBrush, innerBrush, SUBTRACTION);

	outerGeometry.dispose();
	innerGeometry.dispose();

	return result.geometry;
}
