<script lang="ts">
	import { onMount } from 'svelte';
	import * as THREE from 'three';
	import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
	import { fluteParams, type FluteParameters } from '$lib/stores/fluteStore';
	import { createHeadJointGeometry } from '$lib/geometry/headjointGeometry';

	interface CameraPose {
		position: THREE.Vector3;
		lookAt?: THREE.Vector3;
	}

	interface ParameterTrigger {
		keys: (keyof FluteParameters)[];
		pose: CameraPose;
	}

	// Define camera poses for different parameter changes
	const cameraPoseTriggers: ParameterTrigger[] = [
		{
			keys: ['boreDiameter', 'wallThickness'],
			pose: { position: new THREE.Vector3(200, 0, 0) }
		},
		{
			keys: ['embouchureHoleLength', 'embouchureHoleWidth'],
			pose: { position: new THREE.Vector3(50, 100, 0) }
		},
		{
			keys: ['corkThickness', 'corkDistance'],
			pose: { position: new THREE.Vector3(-100, 80, 80) }
		}
	];

	let canvas: HTMLCanvasElement;
	let scene: THREE.Scene;
	let camera: THREE.PerspectiveCamera;
	let renderer: THREE.WebGLRenderer;
	let controls: OrbitControls;
	let animationId: number;
	let headJointGroup: THREE.Group | null = null;
	let disposeHeadJoint: (() => void) | null = null;
	
	let previousParams: FluteParameters;
	let targetCameraPosition: THREE.Vector3 | null = null;
	let targetLookAt: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
	let cameraAnimating = false;

	onMount(() => {
		initScene();
		updateGeometry();
		animate();
		
		// Store initial values
		previousParams = { ...$fluteParams };

		return () => {
			if (animationId) {
				cancelAnimationFrame(animationId);
			}
			if (disposeHeadJoint) {
				disposeHeadJoint();
			}
			controls?.dispose();
			renderer?.dispose();
		};
	});

	function detectChangedParameters(current: FluteParameters, previous: FluteParameters): (keyof FluteParameters)[] {
		const changed: (keyof FluteParameters)[] = [];
		for (const key in current) {
			if (current[key as keyof FluteParameters] !== previous[key as keyof FluteParameters]) {
				changed.push(key as keyof FluteParameters);
			}
		}
		return changed;
	}

	function animateToCameraPose(pose: CameraPose) {
		targetCameraPosition = pose.position.clone();
		targetLookAt = pose.lookAt ? pose.lookAt.clone() : new THREE.Vector3(0, 0, 0);
		cameraAnimating = true;
	}

	// Reactive update when flute parameters change
	$: if (scene && $fluteParams) {
		const changedKeys = detectChangedParameters($fluteParams, previousParams);
		
		if (changedKeys.length > 0) {
			// Find the first matching trigger (most recent change takes priority)
			const matchingTrigger = cameraPoseTriggers.find(trigger =>
				trigger.keys.some(key => changedKeys.includes(key))
			);
			
			if (matchingTrigger) {
				animateToCameraPose(matchingTrigger.pose);
			}
			
			previousParams = { ...$fluteParams };
		}
		
		updateGeometry();
	}

	function initScene() {
		scene = new THREE.Scene();
		scene.background = new THREE.Color(0x111827); // gray-900

		const gridHelper = new THREE.GridHelper(500, 50, 0xb5501b, 0x543126);
		scene.add(gridHelper);
        
		camera = new THREE.PerspectiveCamera(
			75,
			canvas.clientWidth / canvas.clientHeight,
			1,
			2000
		);
		camera.position.set(0, 200, 200);
		camera.lookAt(0, 0, 0);


		renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
		renderer.setSize(canvas.clientWidth, canvas.clientHeight);
		renderer.setPixelRatio(window.devicePixelRatio);

		controls = new OrbitControls(camera, renderer.domElement);
		controls.enableDamping = true;
		controls.dampingFactor = 0.05;

		const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
		scene.add(ambientLight);

		const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
		directionalLight.position.set(5, 5, 5);
		scene.add(directionalLight);

		window.addEventListener('resize', handleResize);
	}

	function updateGeometry() {
		if (!scene) return;

		// Remove old geometry
		if (headJointGroup) {
			scene.remove(headJointGroup);
		}
		if (disposeHeadJoint) {
			disposeHeadJoint();
		}

		// Create new geometry
		const result = createHeadJointGeometry($fluteParams);
		headJointGroup = result.group;
		disposeHeadJoint = result.dispose;
		scene.add(headJointGroup);
	}

	function handleResize() {
		if (!camera || !renderer || !canvas) return;

		camera.aspect = canvas.clientWidth / canvas.clientHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(canvas.clientWidth, canvas.clientHeight);
	}

	function animate() {
		animationId = requestAnimationFrame(animate);
		
		// Smooth camera animation
		if (cameraAnimating && targetCameraPosition) {
			camera.position.lerp(targetCameraPosition, 0.1);
			
			// Smoothly update lookAt target
			const currentLookAt = new THREE.Vector3();
			camera.getWorldDirection(currentLookAt);
			currentLookAt.multiplyScalar(-1).add(camera.position);
			currentLookAt.lerp(targetLookAt, 0.1);
			camera.lookAt(currentLookAt);
			
			// Stop animating when close enough
			if (camera.position.distanceTo(targetCameraPosition) < 1) {
				camera.lookAt(targetLookAt);
				cameraAnimating = false;
				targetCameraPosition = null;
			}
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
