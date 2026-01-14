import * as THREE from 'three';
import type { FluteParameters, ToneHoleParameters } from '../stores/fluteStore';

interface FullFluteGeometryResult {
	group: THREE.Group;
	dispose: () => void;
}

export function createFullFluteGeometry(
	fluteParams: FluteParameters,
	toneHoleParams: ToneHoleParameters
): FullFluteGeometryResult {
	const group = new THREE.Group();
	const geometries: THREE.BufferGeometry[] = [];
	
	// TODO: Implement full flute geometry with:
	// - Complete tube body
	// - Headjoint with embouchure hole
	// - All tone holes positioned according to toneHoleParams
	// - Cork and overhang
	
	// Placeholder: Simple cylinder representing the full flute
	const material = new THREE.MeshStandardMaterial({
		color: 0x10b981,
		roughness: 0.4,
		metalness: 0.3,
	});
	
	const cylinderGeometry = new THREE.CylinderGeometry(
		fluteParams.boreDiameter / 2 + fluteParams.wallThickness,
		fluteParams.boreDiameter / 2 + fluteParams.wallThickness,
		fluteParams.fluteLength,
		32
	);
	cylinderGeometry.rotateZ(Math.PI / 2);
	
	const mesh = new THREE.Mesh(cylinderGeometry, material);
	group.add(mesh);
	geometries.push(cylinderGeometry);
	
	// TODO: Add tone hole indicators
	// const holeIndicatorMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
	// for (let i = 0; i < fluteParams.numberOfToneHoles; i++) {
	//   const diameter = toneHoleParams.holeDiameters[i] || 0;
	//   const distance = toneHoleParams.holeDistances[i] || 0;
	//   // Create hole geometry at distance position
	// }
	
	const dispose = () => {
		geometries.forEach(geom => geom.dispose());
		material.dispose();
	};
	
	return { group, dispose };
}
