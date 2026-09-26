<script lang="ts">
	import { onMount } from 'svelte';
	import * as THREE from 'three';
	import { currentDesignStep } from '$lib/stores/uiStore';
	import type { ResolvedDesignSnapshot } from '$lib/api/generation';
	import type { FluteParameters } from '$lib/domain/fluteTypes';
	import { fluteParams, toneHoleParams } from '$lib/stores/fluteStore';
	import { createThreeScene, handleCanvasResize } from '$lib/geometry/preview/sceneSetup';
	import { applySectionCut, restoreOriginalGeometry } from './sectionAnalysis';
	import { 
		cameraPoseTriggers, 
		detectChangedParameters, 
		updateCameraAnimation,
		BIRDS_EYE_VIEW_POSE,
		type ParameterTrigger 
	} from './cameraAnimations';
	import {
		createLegacyPreviewSnapshot,
		previewKindForStep,
		threePreviewService
	} from './geometryManager';
	import sectionCutIcon from '$lib/assets/section-cut.svg';

	/** Prefer the central evaluator snapshot; omitted while legacy route wiring remains. */
	export let snapshot: ResolvedDesignSnapshot | null = null;

	const GEOMETRY_DEBOUNCE_MS = 60;
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
	let previewRoot: THREE.Group | null = null;
	let renderedSnapshot: ResolvedDesignSnapshot | null = null;
	let disposeGeometry: (() => void) | null = null;
	let disposeScene: (() => void) | null = null;
	let geometryTimer: ReturnType<typeof setTimeout> | null = null;
	let geometryRequest = 0;
	let mounted = false;
	let activeSnapshot: ResolvedDesignSnapshot;
	let activeFluteParams: FluteParameters;
	
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
		mounted = true;
		const sceneSetup = createThreeScene(canvas);
		scene = sceneSetup.scene;
		camera = sceneSetup.camera;
        camera.near = 0.1;
        camera.far = 10000;
		renderer = sceneSetup.renderer;
		controls = sceneSetup.controls;
		disposeScene = sceneSetup.dispose;
		
		scheduleGeometryUpdate();
		animate();
		previousParams = { ...activeFluteParams };

		resizeObserver = new ResizeObserver((entries) => {
			const entry = entries[0];
			if (!entry) return;
			const { width, height } = entry.contentRect;
			if (width === 0 || height === 0) return;
			handleCanvasResize(canvas, camera, renderer);
		});
		resizeObserver.observe(canvas);

		return () => {
			mounted = false;
			geometryRequest++;
			if (geometryTimer) clearTimeout(geometryTimer);
			if (animationId) cancelAnimationFrame(animationId);
			disposeCurrentGeometry();
			if (disposeScene) disposeScene();
			if (resizeObserver) resizeObserver.disconnect();
		};
	});

	function handleParameterChange() {
		const changedKeys = detectChangedParameters(activeFluteParams, previousParams);
		
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
			
			previousParams = { ...activeFluteParams };
		}
	}

	$: activeSnapshot =
		snapshot ?? createLegacyPreviewSnapshot($fluteParams, $toneHoleParams);
	$: activeFluteParams = activeSnapshot.design.flute;

	$: if (scene && activeFluteParams) {
		handleParameterChange();
	}

	$: if (scene && activeSnapshot && $currentDesignStep) {
		scheduleGeometryUpdate();
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

		const params = renderedSnapshot?.design.flute ?? activeFluteParams;
		const outerDiameter = params.boreDiameter + (2 * params.wallThickness);
		
		const cutGroup = applySectionCut(geometryGroup, outerDiameter, params.fluteLength);
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

	function disposeCurrentGeometry() {
		if (geometryGroup) {
			scene.remove(geometryGroup);
			if (geometryGroup !== previewRoot) {
				geometryGroup.traverse((child) => {
					if (child instanceof THREE.Mesh) child.geometry.dispose();
				});
			}
		}
		disposeGeometry?.();
		geometryGroup = null;
		previewRoot = null;
		disposeGeometry = null;
		renderedSnapshot = null;
		sectionAnalysisEnabled = false;
		originalGeometryGroup = null;
	}

	function scheduleGeometryUpdate() {
		if (!scene) return;
		if (geometryTimer) clearTimeout(geometryTimer);

		const requestedSnapshot = activeSnapshot;
		const requestedKind = previewKindForStep($currentDesignStep);
		const request = ++geometryRequest;
		geometryTimer = setTimeout(() => {
			geometryTimer = null;
			void updateGeometry(requestedSnapshot, requestedKind, request);
		}, GEOMETRY_DEBOUNCE_MS);
	}

	async function updateGeometry(
		requestedSnapshot: ResolvedDesignSnapshot,
		requestedKind: ReturnType<typeof previewKindForStep>,
		request: number
	) {
		const result = await threePreviewService.build({
			snapshot: requestedSnapshot,
			previewKind: requestedKind
		});
		if (!result.ok) {
			console.error('Failed to build Three.js preview', result.error);
			return;
		}

		const currentKind = previewKindForStep($currentDesignStep);
		const stale =
			!mounted ||
			request !== geometryRequest ||
			requestedSnapshot.revision !== activeSnapshot.revision ||
			requestedSnapshot.fingerprint !== activeSnapshot.fingerprint ||
			requestedKind !== currentKind;
		if (stale) {
			result.value.dispose();
			return;
		}

		if (!(result.value.root instanceof THREE.Group)) {
			result.value.dispose();
			console.error('Three.js preview root must be a Group');
			return;
		}

		const shouldEnableSectionAnalysis = getDesiredSectionAnalysisState();
		disposeCurrentGeometry();

		geometryGroup = result.value.root;
		previewRoot = result.value.root;
		disposeGeometry = result.value.dispose;
		renderedSnapshot = requestedSnapshot;
		scene.add(geometryGroup);

		sectionAnalysisEnabled = false;
		originalGeometryGroup = null;

		if (shouldEnableSectionAnalysis) enableSectionAnalysis();
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