<script lang="ts">
	import { onMount } from 'svelte';
	import * as THREE from 'three';
	import { fluteParams, toneHoleParams, currentDesignStep, type FluteParameters } from '$lib/stores/fluteStore';
	import { createThreeScene, handleCanvasResize } from '$lib/geometry/sceneSetup';
	import { applySectionCut, restoreOriginalGeometry } from './sectionAnalysis';
	import { 
		cameraPoseTriggers, 
		detectChangedParameters, 
		updateCameraAnimation,
		type ParameterTrigger 
	} from './cameraAnimations';
	import { createGeometryForStep } from './geometryManager';

	let sectionAnalysisEnabled = false;
	let originalGeometryGroup: THREE.Group | null = null;

	let canvas: HTMLCanvasElement;
	let scene: THREE.Scene;
	let camera: THREE.PerspectiveCamera;
	let renderer: THREE.WebGLRenderer;
	let controls: import('three/addons/controls/OrbitControls.js').OrbitControls;
	let animationId: number;
	let geometryGroup: THREE.Group | null = null;
	let disposeGeometry: (() => void) | null = null;
	let disposeScene: (() => void) | null = null;
	
	let previousParams: FluteParameters;
	let targetCameraPosition: THREE.Vector3 | null = null;
	let targetLookAt: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
	let cameraAnimating = false;
	let activeTrigger: ParameterTrigger | null = null;

	// Create triggers with section analysis callbacks
	const triggers = cameraPoseTriggers.map((trigger, index) => ({
		...trigger,
		onActivate: index === 2 ? enableSectionAnalysis : disableSectionAnalysis,
		onDeactivate: index === 2 ? disableSectionAnalysis : undefined
	}));

	onMount(() => {
		const sceneSetup = createThreeScene(canvas);
		scene = sceneSetup.scene;
		camera = sceneSetup.camera;
		renderer = sceneSetup.renderer;
		controls = sceneSetup.controls;
		disposeScene = sceneSetup.dispose;
		
		updateGeometry();
		animate();
		previousParams = { ...$fluteParams };

		window.addEventListener('resize', () => handleCanvasResize(canvas, camera, renderer));

		return () => {
			if (animationId) cancelAnimationFrame(animationId);
			if (disposeGeometry) disposeGeometry();
			if (disposeScene) disposeScene();
			window.removeEventListener('resize', () => handleCanvasResize(canvas, camera, renderer));
		};
	});

	$: if (scene && ($fluteParams || $currentDesignStep)) {
		const changedKeys = detectChangedParameters($fluteParams, previousParams);
		
		if (changedKeys.length > 0) {
			const matchingTrigger = triggers.find(trigger =>
				trigger.keys.some(key => changedKeys.includes(key))
			);
			
			if (matchingTrigger) {
				if (activeTrigger && activeTrigger !== matchingTrigger && activeTrigger.onDeactivate) {
					activeTrigger.onDeactivate();
				}
				
				targetCameraPosition = matchingTrigger.pose.position.clone();
				targetLookAt = matchingTrigger.pose.lookAt?.clone() || new THREE.Vector3(0, 0, 0);
				cameraAnimating = true;
				
				if (matchingTrigger.onActivate) {
					matchingTrigger.onActivate();
				}
				
				activeTrigger = matchingTrigger;
			}
			
			previousParams = { ...$fluteParams };
		}
		
		updateGeometry();
	}

	function enableSectionAnalysis() {
		if (!scene || sectionAnalysisEnabled || !geometryGroup) return;
		
		sectionAnalysisEnabled = true;
		originalGeometryGroup = geometryGroup.clone();
		
		const cutGroup = applySectionCut(geometryGroup);
		scene.remove(geometryGroup);
		geometryGroup = cutGroup;
		scene.add(geometryGroup);
	}

	function disableSectionAnalysis() {
		if (!scene || !sectionAnalysisEnabled || !originalGeometryGroup || !geometryGroup) return;
		
		sectionAnalysisEnabled = false;
		geometryGroup = restoreOriginalGeometry(scene, geometryGroup, originalGeometryGroup);
		scene.add(geometryGroup);
		originalGeometryGroup = null;
	}

	function updateGeometry() {
		if (!scene) return;

		if (geometryGroup) scene.remove(geometryGroup);
		if (disposeGeometry) disposeGeometry();

		const result = createGeometryForStep($currentDesignStep, $fluteParams, $toneHoleParams);
		geometryGroup = result.group;
		disposeGeometry = result.dispose;
		scene.add(geometryGroup);
		
		if (sectionAnalysisEnabled) {
			sectionAnalysisEnabled = false;
			enableSectionAnalysis();
		}
	}

	function animate() {
		animationId = requestAnimationFrame(animate);
		
		if (cameraAnimating && targetCameraPosition) {
			cameraAnimating = updateCameraAnimation(camera, targetCameraPosition, targetLookAt);
			if (!cameraAnimating) targetCameraPosition = null;
		}
		
		controls.update();
		renderer.render(scene, camera);
	}
</script>

<canvas bind:this={canvas} class="w-full h-full"></canvas>

<style>
	canvas {
		display: block;
	}
</style>