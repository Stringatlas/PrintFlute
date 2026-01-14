import * as THREE from 'three';
import { Brush, Evaluator, SUBTRACTION } from 'three-bvh-csg';

export function applySectionCut(geometryGroup: THREE.Group): THREE.Group {
	// Store original for potential restoration
	const cutGroup = geometryGroup.clone();
	
	// Create a cutting box positioned to cut vertically from the side (Z > 0)
	const boxSize = 500;
	const boxGeometry = new THREE.BoxGeometry(boxSize, boxSize, boxSize / 2);
	boxGeometry.translate(0, 0, boxSize / 4); // Position box on positive Z side
	
	const boxBrush = new Brush(boxGeometry);
	const evaluator = new Evaluator();
	
	// Apply boolean cut to all meshes
	cutGroup.traverse((child) => {
		if (child instanceof THREE.Mesh) {
			const meshBrush = new Brush(child.geometry, child.material);
			meshBrush.updateMatrixWorld();
			
			// Perform subtraction to cut away one side
			const result = evaluator.evaluate(meshBrush, boxBrush, SUBTRACTION);
			
			// Update the mesh with the cut geometry
			child.geometry.dispose();
			child.geometry = result.geometry;
		}
	});
	
	boxGeometry.dispose();
	return cutGroup;
}

export function restoreOriginalGeometry(
	scene: THREE.Scene,
	currentGroup: THREE.Group,
	originalGroup: THREE.Group
): THREE.Group {
	scene.remove(currentGroup);
	
	// Dispose modified geometry
	currentGroup.traverse((child) => {
		if (child instanceof THREE.Mesh) {
			child.geometry.dispose();
		}
	});
	
	// Return cloned original
	return originalGroup.clone();
}
