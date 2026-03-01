import * as THREE from 'three';
import { SCENE_COLORS } from './materials';

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
		backgroundColor = SCENE_COLORS.annotationBackground,
		textColor = SCENE_COLORS.annotationText
	} = options;

	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d')!;

	ctx.font = `bold ${fontSize}px sans-serif`;
	const textMetrics = ctx.measureText(text);
	const padding = fontSize;

	canvas.width = Math.ceil(textMetrics.width + padding * 2);
	canvas.height = Math.ceil(fontSize * 1.5 + padding);

	ctx.fillStyle = backgroundColor;
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	ctx.font = `bold ${fontSize}px sans-serif`;
	ctx.fillStyle = textColor;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.fillText(text, canvas.width / 2, canvas.height / 2);

	const texture = new THREE.CanvasTexture(canvas);
	const aspectRatio = canvas.width / canvas.height;
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

export function addLabel(
	group: THREE.Group,
	text: string,
	position: { x: number; y: number; z: number },
	options?: LabelOptions
): { dispose: () => void } {
	const { sprite, texture } = createTextSprite(text, options);
	sprite.position.set(position.x, position.y, position.z);
	group.add(sprite);

	const dispose = () => {
		group.remove(sprite);
		sprite.material.dispose();
		texture.dispose();
	};

	return { dispose };
}
