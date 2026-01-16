import * as THREE from 'three';
import type { FluteParameters, ToneHoleParameters } from '../stores/fluteStore';
import { createFullFluteGeometry } from './fullFluteGeometry';

interface PrintingFluteGeometryResult {
	group: THREE.Group;
	dispose: () => void;
}

function createTextSprite(text: string): { sprite: THREE.Sprite; texture: THREE.CanvasTexture } {
	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d')!;
	
	canvas.width = 256;
	canvas.height = 128;
	
	ctx.fillStyle = 'rgba(255, 26, 26, 0.9)';
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	
	ctx.font = 'bold 48px sans-serif';
	ctx.fillStyle = '#ffffff';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.fillText(text, canvas.width / 2, canvas.height / 2);
	
	const texture = new THREE.CanvasTexture(canvas);
	const spriteMaterial = new THREE.SpriteMaterial({ 
		map: texture,
		toneMapped: false
	});
	const sprite = new THREE.Sprite(spriteMaterial);
	sprite.scale.set(20, 10, 1);
	
	return { sprite, texture };
}

export function createPrintingFluteGeometry(
	fluteParams: FluteParameters,
	toneHoleParams: ToneHoleParameters
): PrintingFluteGeometryResult {
	const result = createFullFluteGeometry(fluteParams, toneHoleParams);
	const group = result.group;
	
	const geometries: THREE.BufferGeometry[] = [];
	const materials: THREE.Material[] = [];
	const textures: THREE.Texture[] = [];
	
	const cutLineMaterial = new THREE.MeshBasicMaterial({ 
		color: 0xff1a1a,
		toneMapped: false
	});
	materials.push(cutLineMaterial);
	
	const outerRadius = fluteParams.boreDiameter / 2 + fluteParams.wallThickness;
	const centerOffset = -fluteParams.fluteLength / 2;
	const tubeRadius = 0.8;
	
	fluteParams.cutDistances.forEach((cutDistance, index) => {
		if (cutDistance > 0 && cutDistance < fluteParams.fluteLength) {
			const circlePoints: THREE.Vector3[] = [];
			for (let i = 0; i <= 64; i++) {
				const angle = (i / 64) * Math.PI * 2;
				circlePoints.push(new THREE.Vector3(
					centerOffset + cutDistance,
					outerRadius * Math.cos(angle),
					outerRadius * Math.sin(angle)
				));
			}
			
			const curve = new THREE.CatmullRomCurve3(circlePoints);
			const tubeGeometry = new THREE.TubeGeometry(curve, 64, tubeRadius, 8, true);
			const tubeMesh = new THREE.Mesh(tubeGeometry, cutLineMaterial);
			group.add(tubeMesh);
			geometries.push(tubeGeometry);
			
			const { sprite, texture } = createTextSprite(`Cut ${index + 1}`);
			const spriteWidth = 20;
			const zOffset = outerRadius + spriteWidth / 2 + 5;
			sprite.position.set(centerOffset + cutDistance, 0, zOffset);
			group.add(sprite);
			textures.push(texture);
			materials.push(sprite.material);
		}
	});
	
	const dispose = () => {
		result.dispose();
		geometries.forEach(geom => geom.dispose());
		materials.forEach(mat => mat.dispose());
		textures.forEach(tex => tex.dispose());
	};
	
	return { group, dispose };
}
