<script>
  // @ts-nocheck
  // FIXME: Flute clipping / disappearing at certain angles
  import { onMount, onDestroy } from "svelte";
  import * as THREE from "three";
  import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
  import { syncFaces, syncLines } from "replicad-threejs-helper";

  export let faces = null;
  export let edges = null;

  let container;
  let scene, camera, renderer, controls, bodyGeometry, linesGeometry, animationId;
  let mesh, lineSegments;

  THREE.Object3D.DEFAULT_UP.set(0, 0, 1);

  function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f5);

    camera = new THREE.PerspectiveCamera(
      50,
      container.clientWidth / container.clientHeight,
      0.1,
      10000
    );
    camera.position.set(100, 150, 100);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const light = new THREE.DirectionalLight(0xffffff, 0.8);
    light.position.set(100, 100, 100);
    scene.add(light);

    bodyGeometry = new THREE.BufferGeometry();
    linesGeometry = new THREE.BufferGeometry();

    mesh = new THREE.Mesh(
      bodyGeometry,
      new THREE.MeshStandardMaterial({ 
        color: 0x5a8296,
        side: THREE.DoubleSide
      })
    );
    lineSegments = new THREE.LineSegments(
      linesGeometry,
      new THREE.LineBasicMaterial({ color: 0x3c5a6e })
    );
    
    scene.add(mesh);
    scene.add(lineSegments);

    window.addEventListener("resize", onResize);
    animate();
  }

  function fitCameraToGeometry() {
    if (!mesh || !bodyGeometry || !bodyGeometry.attributes.position) return;
    
    bodyGeometry.computeBoundingBox();
    const boundingBox = bodyGeometry.boundingBox;
    
    if (!boundingBox) return;
    
    const center = new THREE.Vector3();
    boundingBox.getCenter(center);
    
    const size = new THREE.Vector3();
    boundingBox.getSize(size);
    
    // Set camera position to view the entire object
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180);
    
    // Calculate distance to fit entire bounding sphere
    const boundingSphereRadius = size.length() / 2;
    let cameraZ = Math.abs(boundingSphereRadius / Math.tan(fov / 2)) * 2;
    
    camera.position.set(center.x + cameraZ * 0.5, center.y + cameraZ * 0.75, center.z + cameraZ * 0.5);
    camera.lookAt(center);
    
    // Update controls target to center of geometry
    controls.target.copy(center);
    controls.update();
    
    // Very small near plane to prevent clipping at any angle
    // Far plane needs to be large enough for the entire scene
    camera.near = boundingSphereRadius * 0.001;
    camera.far = boundingSphereRadius * 1000;
    camera.updateProjectionMatrix();
  }

  function updateGeometry() {
    if (!bodyGeometry || !linesGeometry) return;
    if (faces) syncFaces(bodyGeometry, faces);
    if (edges) syncLines(linesGeometry, edges);
    
    // Fit camera after geometry is updated
    fitCameraToGeometry();
  }

  function onResize() {
    if (!container) return;
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  }

  function animate() {
    animationId = requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }

  onMount(() => {
    init();
    updateGeometry();
  });

  onDestroy(() => {
    cancelAnimationFrame(animationId);
    window.removeEventListener("resize", onResize);
    controls?.dispose();
    bodyGeometry?.dispose();
    linesGeometry?.dispose();
    renderer?.renderLists?.dispose();
    renderer?.forceContextLoss();
    renderer?.dispose();
    if (renderer?.domElement && container?.contains(renderer.domElement)) {
      container.removeChild(renderer.domElement);
    }
    renderer = null;
  });

  $: if (faces || edges) updateGeometry();
</script>

<div bind:this={container} class="w-full h-100 rounded-lg overflow-hidden"></div>