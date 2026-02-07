import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

interface SceneSetupResult {
	scene: THREE.Scene;
	camera: THREE.PerspectiveCamera;
	renderer: THREE.WebGLRenderer;
	controls: OrbitControls;
	dispose: () => void;
}

export function createThreeScene(canvas: HTMLCanvasElement): SceneSetupResult {
	const scene = new THREE.Scene();
	scene.background = new THREE.Color(0x111827);
	
	const gridHelper = new THREE.GridHelper(500, 50, 0xb5501b, 0x543126);
	scene.add(gridHelper);
	
	const camera = new THREE.PerspectiveCamera(
		75,
		canvas.clientWidth / canvas.clientHeight,
		1,
		2000
	);
	camera.position.set(0, 200, 200);
	camera.lookAt(0, 0, 0);
	
	const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
	renderer.setSize(canvas.clientWidth, canvas.clientHeight);
	renderer.setPixelRatio(window.devicePixelRatio);
	
	const controls = new OrbitControls(camera, renderer.domElement);
	controls.enableDamping = true;
	controls.dampingFactor = 0.05;
	
	const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
	scene.add(ambientLight);
	
	const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
	directionalLight.position.set(5, 5, 5);
	scene.add(directionalLight);
	
	const dispose = () => {
		controls.dispose();
		renderer.dispose();
		// Note: Geometries and materials in the scene should be disposed separately
	};
	
	return { scene, camera, renderer, controls, dispose };
}

export function handleCanvasResize(
	canvas: HTMLCanvasElement,
	camera: THREE.PerspectiveCamera,
	renderer: THREE.WebGLRenderer
) {
	camera.aspect = canvas.clientWidth / canvas.clientHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(canvas.clientWidth, canvas.clientHeight);
}
