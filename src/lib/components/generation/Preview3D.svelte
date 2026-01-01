<script lang="ts">
	import { onMount } from 'svelte';
	import * as THREE from 'three';
	import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

	let canvas: HTMLCanvasElement;
	let scene: THREE.Scene;
	let camera: THREE.PerspectiveCamera;
	let renderer: THREE.WebGLRenderer;
	let controls: OrbitControls;
	let animationId: number;

	onMount(() => {
		initScene();
		animate();

		return () => {
			if (animationId) {
				cancelAnimationFrame(animationId);
			}
			controls?.dispose();
			renderer?.dispose();
		};
	});

	function initScene() {
		// Scene
		scene = new THREE.Scene();
		scene.background = new THREE.Color(0x0a0a0a);

		// Camera
		camera = new THREE.PerspectiveCamera(
			75,
			canvas.clientWidth / canvas.clientHeight,
			0.1,
			1000
		);
		camera.position.set(0, 0, 5);

		// Renderer
		renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
		renderer.setSize(canvas.clientWidth, canvas.clientHeight);
		renderer.setPixelRatio(window.devicePixelRatio);

		// Controls
		controls = new OrbitControls(camera, renderer.domElement);
		controls.enableDamping = true;
		controls.dampingFactor = 0.05;

		// Lighting
		const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
		scene.add(ambientLight);

		const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
		directionalLight.position.set(5, 5, 5);
		scene.add(directionalLight);

		// Placeholder: Simple flute-like cylinder
		const geometry = new THREE.CylinderGeometry(0.3, 0.3, 4, 32);
		const material = new THREE.MeshStandardMaterial({
			color: 0x10b981,
			metalness: 0.3,
			roughness: 0.4
		});
		const flute = new THREE.Mesh(geometry, material);
		flute.rotation.z = Math.PI / 2;
		scene.add(flute);

		// Grid helper
		const gridHelper = new THREE.GridHelper(10, 10, 0x10b981, 0x1f2937);
		scene.add(gridHelper);

		// Handle resize
		window.addEventListener('resize', handleResize);
	}

	function handleResize() {
		if (!camera || !renderer || !canvas) return;

		camera.aspect = canvas.clientWidth / canvas.clientHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(canvas.clientWidth, canvas.clientHeight);
	}

	function animate() {
		animationId = requestAnimationFrame(animate);
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
