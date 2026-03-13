<script lang="ts">
	import { onMount } from 'svelte';
	import * as THREE from 'three';
    import { currentDesignStep } from '$lib/stores/uiStore';
	import { fluteParams, toneHoleParams, type FluteParameters } from '$lib/stores/fluteStore';
	import { createThreeScene, handleCanvasResize } from '$lib/geometry/preview/sceneSetup';
	import { applySectionCut, restoreOriginalGeometry } from './sectionAnalysis';
	import { 
		cameraPoseTriggers, 
		detectChangedParameters, 
		updateCameraAnimation,
		BIRDS_EYE_VIEW_POSE,
		type ParameterTrigger 
	} from './cameraAnimations';
	import { createGeometryForStep } from './geometryManager';
	import sectionCutIcon from '$lib/assets/section-cut.svg';

	let sectionAnalysisEnabled = false;
	let automaticSectionAnalysisEnabled = false;
	let sectionAnalysisOverride: boolean | null = null;
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
	let resizeObserver: ResizeObserver | null = null;

	$: isSectionAnalysisOn = sectionAnalysisEnabled;

	// Camera pose triggers from cameraAnimations.ts:
	// [0] = Bore diameter & wall thickness -> side view
	// [1] = Embouchure hole dimensions -> angled close-up
	// [2] = Cork parameters -> headjoint interior view (with section cut)
	const CORK_TRIGGER_INDEX = 2;
	
	const triggers = cameraPoseTriggers.map((trigger, index) => ({
		...trigger,
		onActivate: index === CORK_TRIGGER_INDEX
			? () => setAutomaticSectionAnalysisState(true)
			: () => setAutomaticSectionAnalysisState(false),
		onDeactivate: index === CORK_TRIGGER_INDEX ? () => setAutomaticSectionAnalysisState(false) : undefined
	}));

	export function setSectionAnalysisOverride(enabled: boolean) {
		sectionAnalysisOverride = enabled;
		applyDesiredSectionAnalysisState();
	}

	export function clearSectionAnalysisOverride() {
		sectionAnalysisOverride = null;
		applyDesiredSectionAnalysisState();
	}

	export function getSectionAnalysisState() {
		return sectionAnalysisEnabled;
	}

	function toggleSectionAnalysis() {
		setSectionAnalysisOverride(!sectionAnalysisEnabled);
	}

	onMount(() => {
		const sceneSetup = createThreeScene(canvas);
		scene = sceneSetup.scene;
		camera = sceneSetup.camera;
        camera.near = 0.1;
        camera.far = 10000;
		renderer = sceneSetup.renderer;
		controls = sceneSetup.controls;
		disposeScene = sceneSetup.dispose;
		
		updateGeometry();
		animate();
		previousParams = { ...$fluteParams };

		resizeObserver = new ResizeObserver((entries) => {
			const entry = entries[0];
			if (!entry) return;
			const { width, height } = entry.contentRect;
			if (width === 0 || height === 0) return;
			handleCanvasResize(canvas, camera, renderer);
		});
		resizeObserver.observe(canvas);

		return () => {
			if (animationId) cancelAnimationFrame(animationId);
			if (disposeGeometry) disposeGeometry();
			if (disposeScene) disposeScene();
			if (resizeObserver) resizeObserver.disconnect();
		};
	});

	function handleParameterChange() {
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

	$: if (scene && ($fluteParams || $currentDesignStep)) {
		handleParameterChange();
	}
	
	$: if (scene && camera && $currentDesignStep === 3) {
		targetCameraPosition = BIRDS_EYE_VIEW_POSE.position.clone();
		targetLookAt = BIRDS_EYE_VIEW_POSE.lookAt?.clone() || new THREE.Vector3(0, 0, 0);
		cameraAnimating = true;
	}

	$: if (scene && geometryGroup) {
		applyDesiredSectionAnalysisState();
	}

	function setAutomaticSectionAnalysisState(enabled: boolean) {
		automaticSectionAnalysisEnabled = enabled;
		applyDesiredSectionAnalysisState();
	}

	function getDesiredSectionAnalysisState() {
		return sectionAnalysisOverride ?? automaticSectionAnalysisEnabled;
	}

	function applyDesiredSectionAnalysisState() {
		if (!scene || !geometryGroup) return;

		if (getDesiredSectionAnalysisState()) {
			enableSectionAnalysis();
			return;
		}

		disableSectionAnalysis();
	}

	function enableSectionAnalysis() {
		if (!scene || sectionAnalysisEnabled || !geometryGroup) return;
		
		sectionAnalysisEnabled = true;
		originalGeometryGroup = geometryGroup.clone();

		const outerDiameter = $fluteParams.boreDiameter + (2 * $fluteParams.wallThickness);
		
		const cutGroup = applySectionCut(geometryGroup, outerDiameter, $fluteParams.fluteLength);
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

		const shouldEnableSectionAnalysis = getDesiredSectionAnalysisState();

		if (geometryGroup) scene.remove(geometryGroup);
		if (disposeGeometry) disposeGeometry();

		const result = createGeometryForStep($currentDesignStep, $fluteParams, $toneHoleParams);
		geometryGroup = result.group;
		disposeGeometry = result.dispose;
		scene.add(geometryGroup);

		sectionAnalysisEnabled = false;
		originalGeometryGroup = null;

		if (shouldEnableSectionAnalysis) {
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

<div class="relative w-full h-full">
	<canvas bind:this={canvas} class="w-full h-full"></canvas>

	<div class="absolute top-3 right-3 z-10">
		<button
			type="button"
			on:click={toggleSectionAnalysis}
			class={`btn ${isSectionAnalysisOn ? 'btn-primary' : 'btn-secondary'} text-sm px-3 py-2`}
			aria-pressed={isSectionAnalysisOn}
			aria-label={isSectionAnalysisOn ? 'Disable section analysis' : 'Enable section analysis'}
		>
			<img src={sectionCutIcon} alt="" class="w-4 h-4" aria-hidden="true" />
			<span>{isSectionAnalysisOn ? 'Section On' : 'Section Off'}</span>
		</button>
	</div>
</div>

<style>
	canvas {
		display: block;
	}
</style>