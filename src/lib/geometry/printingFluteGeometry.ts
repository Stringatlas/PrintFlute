import * as THREE from 'three';
import type { FluteParameters, ToneHoleParameters } from '../stores/fluteStore';

interface PrintingFluteGeometryResult {
	group: THREE.Group;
	dispose: () => void;
}

export function createPrintingFluteGeometry(
	fluteParams: FluteParameters,
	toneHoleParams: ToneHoleParameters
): PrintingFluteGeometryResult {
	const group = new THREE.Group();
	const geometries: THREE.BufferGeometry[] = [];
	const materials: THREE.Material[] = [];
	
	// TODO: Implement printing flute geometry with:
	// - Full flute body (same as fullFluteGeometry)
	// - Cut lines/outlines indicating where to separate sections
	// - Visual indicators for joints and assembly
	// - Potentially sections already separated for print bed visualization
	
	// Placeholder: Simple flute with cut line indicators
	const fluteMaterial = new THREE.MeshStandardMaterial({
		color: 0x10b981,
		roughness: 0.4,
		metalness: 0.3,
	});
	materials.push(fluteMaterial);
	
	const cylinderGeometry = new THREE.CylinderGeometry(
		fluteParams.boreDiameter / 2 + fluteParams.wallThickness,
		fluteParams.boreDiameter / 2 + fluteParams.wallThickness,
		fluteParams.fluteLength,
		32
	);
	cylinderGeometry.rotateZ(Math.PI / 2);
	
	const fluteMesh = new THREE.Mesh(cylinderGeometry, fluteMaterial);
	group.add(fluteMesh);
	geometries.push(cylinderGeometry);
	
	// TODO: Add cut line indicators
	// const cutLineMaterial = new THREE.LineBasicMaterial({ 
	//   color: 0xff0000, 
	//   linewidth: 2 
	// });
	// materials.push(cutLineMaterial);
	// 
	// // Example: Cut at 1/3 and 2/3 positions
	// const sections = [fluteParams.fluteLength / 3, 2 * fluteParams.fluteLength / 3];
	// sections.forEach(position => {
	//   const circlePoints = [];
	//   for (let i = 0; i <= 32; i++) {
	//     const angle = (i / 32) * Math.PI * 2;
	//     const radius = fluteParams.boreDiameter / 2 + fluteParams.wallThickness;
	//     circlePoints.push(new THREE.Vector3(
	//       position - fluteParams.fluteLength / 2,
	//       radius * Math.cos(angle),
	//       radius * Math.sin(angle)
	//     ));
	//   }
	//   const circleGeometry = new THREE.BufferGeometry().setFromPoints(circlePoints);
	//   const circleLine = new THREE.Line(circleGeometry, cutLineMaterial);
	//   group.add(circleLine);
	//   geometries.push(circleGeometry);
	// });
	
	const dispose = () => {
		geometries.forEach(geom => geom.dispose());
		materials.forEach(mat => mat.dispose());
	};
	
	return { group, dispose };
}
