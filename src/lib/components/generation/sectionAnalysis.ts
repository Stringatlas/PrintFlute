import * as THREE from 'three';
import { Brush, Evaluator, SUBTRACTION } from 'three-bvh-csg';

function createCrossSectionMaterial(): THREE.Material {
	// Create canvas for diagonal hatching pattern
	const canvas = document.createElement('canvas');
	canvas.width = 64;
	canvas.height = 64;
	const ctx = canvas.getContext('2d')!;
	
	// Light gray background for cross-section
	ctx.fillStyle = '#fdba74';
	ctx.fillRect(0, 0, 64, 64);
	
	// Draw diagonal hatching lines
	ctx.strokeStyle = '#212121';
	ctx.lineWidth = 1.5;
	const spacing = 8;
	
	for (let i = -64; i < 128; i += spacing) {
		ctx.beginPath();
		ctx.moveTo(i, 0);
		ctx.lineTo(i + 64, 64);
		ctx.stroke();
	}
	
	const texture = new THREE.CanvasTexture(canvas);
	texture.wrapS = THREE.RepeatWrapping;
	texture.wrapT = THREE.RepeatWrapping;
	texture.repeat.set(4, 4);
	
	return new THREE.MeshStandardMaterial({
		map: texture,
		color: 0xf5f5f5,
		roughness: 0.7,
		metalness: 0.1,
		side: THREE.DoubleSide
	});
}

export function applySectionCut(geometryGroup: THREE.Group, outerDiameter: number): THREE.Group {
	const cutGroup = geometryGroup.clone();
	
	// Use outer diameter to size the cutting box appropriately
	const boxSize = Math.max(outerDiameter * 3, 200);
	const boxGeometry = new THREE.BoxGeometry(boxSize, boxSize, boxSize / 2);
	boxGeometry.translate(0, 0, boxSize / 4);
	
	const boxBrush = new Brush(boxGeometry);
	const evaluator = new Evaluator();
	const crossSectionMaterial = createCrossSectionMaterial();
	
	// Apply boolean cut to all meshes
	cutGroup.traverse((child) => {
		if (child instanceof THREE.Mesh) {
			const originalMaterial = child.material;
			const meshBrush = new Brush(child.geometry, child.material);
			meshBrush.updateMatrixWorld();
			
			// Perform subtraction to cut away one side
			const result = evaluator.evaluate(meshBrush, boxBrush, SUBTRACTION);
			
			// Update the mesh with the cut geometry
			child.geometry.dispose();
			child.geometry = result.geometry;
			
			// Apply cross-section material to cut faces
			// Detect cut faces (those near Z = 0 plane)
			const positions = child.geometry.attributes.position;
			const normals = child.geometry.attributes.normal;
			
			if (positions && normals) {
				const groups = [];
				let cutFaceCount = 0;
				let regularFaceCount = 0;
				
				for (let i = 0; i < positions.count; i += 3) {
					const z0 = positions.getZ(i);
					const z1 = positions.getZ(i + 1);
					const z2 = positions.getZ(i + 2);
					
					// Check if face is on the cut plane (all vertices near Z = 0)
					const isCutFace = Math.abs(z0) < 0.1 && Math.abs(z1) < 0.1 && Math.abs(z2) < 0.1;
					
					if (isCutFace) {
						cutFaceCount++;
					} else {
						regularFaceCount++;
					}
				}
				
				// If we have cut faces, use multi-material
				if (cutFaceCount > 0) {
					groups.push({ start: 0, count: regularFaceCount * 3, materialIndex: 0 });
					groups.push({ start: regularFaceCount * 3, count: cutFaceCount * 3, materialIndex: 1 });
					
					// Reorder vertices: regular faces first, cut faces second
					const newPositions = new Float32Array(positions.count * 3);
					const newNormals = new Float32Array(normals.count * 3);
					let regularIdx = 0;
					let cutIdx = regularFaceCount * 3;
					
					for (let i = 0; i < positions.count; i += 3) {
						const z0 = positions.getZ(i);
						const z1 = positions.getZ(i + 1);
						const z2 = positions.getZ(i + 2);
						const isCutFace = Math.abs(z0) < 0.1 && Math.abs(z1) < 0.1 && Math.abs(z2) < 0.1;
						
						let targetIdx = isCutFace ? cutIdx : regularIdx;
						
						for (let j = 0; j < 3; j++) {
							newPositions[targetIdx * 3] = positions.getX(i + j);
							newPositions[targetIdx * 3 + 1] = positions.getY(i + j);
							newPositions[targetIdx * 3 + 2] = positions.getZ(i + j);
							
							newNormals[targetIdx * 3] = normals.getX(i + j);
							newNormals[targetIdx * 3 + 1] = normals.getY(i + j);
							newNormals[targetIdx * 3 + 2] = normals.getZ(i + j);
							
							targetIdx++;
							if (isCutFace) cutIdx = targetIdx;
							else regularIdx = targetIdx;
						}
					}
					
					child.geometry.setAttribute('position', new THREE.BufferAttribute(newPositions, 3));
					child.geometry.setAttribute('normal', new THREE.BufferAttribute(newNormals, 3));
					child.geometry.groups = groups;
					
					child.material = [originalMaterial, crossSectionMaterial];
				} else {
					child.material = originalMaterial;
				}
			}
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
