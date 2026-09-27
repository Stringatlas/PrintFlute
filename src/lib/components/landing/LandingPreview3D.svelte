<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import * as THREE from 'three';
	import type { ResolvedDesignSnapshot } from '$lib/api/generation';
	import { localGenerationApi } from '$lib/api/generation/local';
	import { threePreviewService } from '$lib/components/generation/geometryManager';
	import type { DesignDraft } from '$lib/domain/fluteTypes';
	import { createThreeScene, handleCanvasResize } from '$lib/geometry/preview/sceneSetup';
	import type { OrbitControls } from 'three/addons/controls/OrbitControls.js';
	import {
		DEFAULT_FLUTE_PARAMETERS,
		DEFAULT_TONE_HOLE_PARAMETERS
	} from '$lib/services/designNormalization';

	let { boreDiameter, wallThickness, holeCount }: {
		boreDiameter: number;
		wallThickness: number;
		holeCount: number;
	} = $props();

	let canvas: HTMLCanvasElement | undefined;
	let scene: THREE.Scene;
	let camera: THREE.PerspectiveCamera;
	let renderer: THREE.WebGLRenderer;
	let controls: OrbitControls;
	let disposeScene: (() => void) | null = null;
	let disposeGeometry: (() => void) | null = null;
	let geometryGroup: THREE.Group | null = null;
	let animationId = 0;
	let requestId = 0;
	let timer: ReturnType<typeof setTimeout> | null = null;
	let resizeObserver: ResizeObserver | null = null;
	let mounted = false;
	let revision = 0;
	let lengthMm = $state<number | null>(null);
	let pending = $state(false);
	let interactive = $state(false);

	$effect(() => {
		boreDiameter;
		wallThickness;
		holeCount;
		if (mounted) schedule();
	});

	onMount(() => {
		if (!canvas) return;
		const setup = createThreeScene(canvas);
		scene = setup.scene;
		camera = setup.camera;
		renderer = setup.renderer;
		controls = setup.controls;
		controls.autoRotate = true;
		controls.autoRotateSpeed = 0.6;
		controls.enableZoom = false;
		controls.enablePan = false;
		controls.enabled = false;
		disposeScene = setup.dispose;
		mounted = true;
		schedule();
		animate();

		resizeObserver = new ResizeObserver(() => {
			if (!canvas) return;
			if (canvas.clientWidth === 0 || canvas.clientHeight === 0) return;
			handleCanvasResize(canvas, camera, renderer);
		});
		resizeObserver.observe(canvas);

		return () => {
			mounted = false;
			if (timer) clearTimeout(timer);
			cancelAnimationFrame(animationId);
			disposeCurrent();
			disposeScene?.();
			resizeObserver?.disconnect();
		};
	});

	onDestroy(() => {
		if (timer) clearTimeout(timer);
	});

	function createDraft(): DesignDraft {
		return {
			flute: {
				...DEFAULT_FLUTE_PARAMETERS,
				boreDiameter,
				wallThickness,
				numberOfToneHoles: Math.round(holeCount),
				cutDistances: [...DEFAULT_FLUTE_PARAMETERS.cutDistances],
				corkDistance: { ...DEFAULT_FLUTE_PARAMETERS.corkDistance },
				corkThickness: { ...DEFAULT_FLUTE_PARAMETERS.corkThickness }
			},
			toneHoles: {
				holeDiameters: [...DEFAULT_TONE_HOLE_PARAMETERS.holeDiameters],
				holeCents: [...DEFAULT_TONE_HOLE_PARAMETERS.holeCents],
				holeDistances: [...DEFAULT_TONE_HOLE_PARAMETERS.holeDistances],
				holeAngles: [...DEFAULT_TONE_HOLE_PARAMETERS.holeAngles],
				cutoffRatios: [...DEFAULT_TONE_HOLE_PARAMETERS.cutoffRatios]
			}
		};
	}

	function schedule() {
		if (timer) clearTimeout(timer);
		pending = true;
		timer = setTimeout(() => {
			timer = null;
			void rebuild();
		}, 80);
	}

	async function rebuild() {
		const current = ++requestId;
		const result = await localGenerationApi.evaluate({
			revision: ++revision,
			design: createDraft()
		});
		if (!mounted || current !== requestId) return;

		if (!result.ok) {
			pending = false;
			return;
		}

		await attach(result.value, current);
	}

	async function attach(snapshot: ResolvedDesignSnapshot, current: number) {
		const preview = await threePreviewService.build({
			snapshot,
			previewKind: 'full'
		});
		if (!mounted || current !== requestId) {
			if (preview.ok) preview.value.dispose();
			return;
		}
		if (!preview.ok || !(preview.value.root instanceof THREE.Group)) {
			pending = false;
			return;
		}

		disposeCurrent();
		geometryGroup = preview.value.root;
		disposeGeometry = preview.value.dispose;
		scene.add(geometryGroup);
		frameModel(geometryGroup);
		lengthMm = snapshot.design.flute.fluteLength;
		pending = false;
	}

	function frameModel(root: THREE.Group) {
		const box = new THREE.Box3().setFromObject(root);
		const size = box.getSize(new THREE.Vector3());
		const center = box.getCenter(new THREE.Vector3());
		const span = Math.max(size.x, size.y, size.z, 1);
		camera.position.set(center.x, center.y + span * 0.45, center.z + span * 0.85);
		camera.near = 0.1;
		camera.far = span * 20;
		camera.updateProjectionMatrix();
		controls.target.copy(center);
		controls.update();
	}

	function disposeCurrent() {
		if (geometryGroup) scene.remove(geometryGroup);
		disposeGeometry?.();
		geometryGroup = null;
		disposeGeometry = null;
	}

	function animate() {
		animationId = requestAnimationFrame(animate);
		controls.update();
		renderer.render(scene, camera);
	}

	function toggleInteraction() {
		interactive = !interactive;
		controls.enabled = interactive;
		controls.autoRotate = !interactive;
	}
</script>

<div class="relative h-full w-full">
	<canvas bind:this={canvas} class="block h-full w-full {interactive ? 'pointer-events-auto cursor-grab active:cursor-grabbing' : 'pointer-events-none'}" style="touch-action: pan-y;"></canvas>
	<div class="pointer-events-none absolute left-4 top-4 flex gap-3 text-xs text-gray-500">
		<span>{pending ? 'Updating geometry…' : 'Generated on this device'}</span>
		{#if lengthMm}
			<span>·</span><span>{lengthMm.toFixed(1)} mm</span>
		{/if}
	</div>
	<button class="absolute bottom-4 right-4 rounded-lg border border-gray-700 bg-gray-950/90 px-3 py-2 text-xs text-gray-300 shadow-lg transition hover:border-gray-600 hover:text-white" onclick={toggleInteraction} aria-pressed={interactive}>
		<i class="bi {interactive ? 'bi-check-lg' : 'bi-box'} mr-1.5"></i>
		{interactive ? 'Finish inspecting' : 'Inspect in 3D'}
	</button>
</div>
