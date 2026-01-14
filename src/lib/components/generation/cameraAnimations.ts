import * as THREE from 'three';
import type { FluteParameters } from '$lib/stores/fluteStore';

export interface CameraPose {
	position: THREE.Vector3;
	lookAt?: THREE.Vector3;
}

export interface ParameterTrigger {
	keys: (keyof FluteParameters)[];
	pose: CameraPose;
	onActivate?: () => void;
	onDeactivate?: () => void;
}

export const cameraPoseTriggers: ParameterTrigger[] = [
	{
		keys: ['boreDiameter', 'wallThickness'],
		pose: { position: new THREE.Vector3(200, 0, 0) }
	},
	{
		keys: ['embouchureHoleLength', 'embouchureHoleWidth'],
		pose: { position: new THREE.Vector3(50, 100, 0) }
	},
	{
		keys: ['corkThickness', 'corkDistance', 'overhangLength'],
		pose: { position: new THREE.Vector3(-100, 80, 80) }
	}
];

export function detectChangedParameters(
	current: FluteParameters,
	previous: FluteParameters
): (keyof FluteParameters)[] {
	const changed: (keyof FluteParameters)[] = [];
	for (const key in current) {
		if (current[key as keyof FluteParameters] !== previous[key as keyof FluteParameters]) {
			changed.push(key as keyof FluteParameters);
		}
	}
	return changed;
}

export function updateCameraAnimation(
	camera: THREE.PerspectiveCamera,
	targetPosition: THREE.Vector3,
	targetLookAt: THREE.Vector3
): boolean {
	camera.position.lerp(targetPosition, 0.1);
	
	// Smoothly update lookAt target
	const currentLookAt = new THREE.Vector3();
	camera.getWorldDirection(currentLookAt);
	currentLookAt.multiplyScalar(-1).add(camera.position);
	currentLookAt.lerp(targetLookAt, 0.1);
	camera.lookAt(currentLookAt);
	
	// Return true if animation should continue
	if (camera.position.distanceTo(targetPosition) < 1) {
		camera.lookAt(targetLookAt);
		return false;
	}
	return true;
}
