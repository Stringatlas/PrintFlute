import * as THREE from 'three';

export const SCENE_COLORS = {
	background: 0x111827,
	gridPrimary: 0xb5501b,
	gridSecondary: 0x543126,
	flute: '#10b981',
	cutLine: 0xff1a1a,
	cutLineAlpha: 0.3,
	annotationBackground: 'rgba(255, 26, 26, 0.9)',
	annotationText: '#ffffff',
} as const;

interface FluteMaterialResult {
	material: THREE.MeshStandardMaterial;
	dispose: () => void;
}

export function createFluteMaterial(): FluteMaterialResult {
	const canvas = document.createElement('canvas');
	canvas.width = 256;
	canvas.height = 256;
	const ctx = canvas.getContext('2d')!;

	ctx.fillStyle = SCENE_COLORS.flute;
	ctx.fillRect(0, 0, 256, 256);

	const texture = new THREE.CanvasTexture(canvas);
	texture.wrapS = THREE.RepeatWrapping;
	texture.wrapT = THREE.RepeatWrapping;

	const material = new THREE.MeshStandardMaterial({
		map: texture,
		roughness: 0.6,
		metalness: 0.05,
		side: THREE.DoubleSide,
	});

	const dispose = () => {
		texture.dispose();
		material.dispose();
	};

	return { material, dispose };
}

export function createCutLineMaterial(): THREE.MeshBasicMaterial {
	return new THREE.MeshBasicMaterial({
		color: SCENE_COLORS.cutLine,
		toneMapped: false,
	});
}

export function createConnectorMaterial(): THREE.MeshBasicMaterial {
	return new THREE.MeshBasicMaterial({
		color: SCENE_COLORS.cutLine,
		transparent: true,
		opacity: SCENE_COLORS.cutLineAlpha,
		toneMapped: false,
	});
}
