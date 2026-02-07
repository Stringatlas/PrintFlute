import * as THREE from 'three';

interface LabelOptions {
	width?: number;
	height?: number;
	fontSize?: number;
	backgroundColor?: string;
	textColor?: string;
}

function createTextSprite(
	text: string,
	options: LabelOptions = {}
): { sprite: THREE.Sprite; texture: THREE.CanvasTexture } {
	const {
		width = 20,
		height = 10,
		fontSize = 48,
		backgroundColor = 'rgba(255, 26, 26, 0.9)',
		textColor = '#ffffff'
	} = options;

	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d')!;

	canvas.width = 256;
	canvas.height = 128;

	ctx.fillStyle = backgroundColor;
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	ctx.font = `bold ${fontSize}px sans-serif`;
	ctx.fillStyle = textColor;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.fillText(text, canvas.width / 2, canvas.height / 2);

	const texture = new THREE.CanvasTexture(canvas);
	const spriteMaterial = new THREE.SpriteMaterial({
		map: texture,
		toneMapped: false
	});
	const sprite = new THREE.Sprite(spriteMaterial);
	sprite.scale.set(width, height, 1);

	return { sprite, texture };
}

export function createLabelSprite(
	text: string,
	position: { x: number; y: number; z: number },
	options?: LabelOptions
): { sprite: THREE.Sprite; texture: THREE.CanvasTexture } {
	const { sprite, texture } = createTextSprite(text, options);
	sprite.position.set(position.x, position.y, position.z);
	return { sprite, texture };
}
