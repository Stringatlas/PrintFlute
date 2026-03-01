import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { SCENE_COLORS } from './materials';

interface SceneSetupResult {
	scene: THREE.Scene;
	camera: THREE.PerspectiveCamera;
	renderer: THREE.WebGLRenderer;
	controls: OrbitControls;
	dispose: () => void;
}

export function createThreeScene(canvas: HTMLCanvasElement): SceneSetupResult {
	const scene = new THREE.Scene();
	scene.background = new THREE.Color(SCENE_COLORS.background);
	
	const gridHelper = new THREE.GridHelper(500, 50, SCENE_COLORS.gridPrimary, SCENE_COLORS.gridSecondary);
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
	renderer.toneMapping = THREE.ACESFilmicToneMapping;
	renderer.toneMappingExposure = 1.2;
	
	const controls = new OrbitControls(camera, renderer.domElement);
	controls.enableDamping = true;
	controls.dampingFactor = 0.05;
	
	const hemisphereLight = new THREE.HemisphereLight(0xddeeff, 0x222233, 0.8);
	scene.add(hemisphereLight);
	
	const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
	keyLight.position.set(100, 150, 100);
	scene.add(keyLight);
	
	const fillLight = new THREE.DirectionalLight(0xb0c4de, 0.6);
	fillLight.position.set(-80, 50, -60);
	scene.add(fillLight);
	
	const rimLight = new THREE.DirectionalLight(0xffffff, 0.4);
	rimLight.position.set(0, -100, 80);
	scene.add(rimLight);
	
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
