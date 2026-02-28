<script lang="ts">
	// @ts-nocheck
	import { onMount } from 'svelte';
	import { wrap } from 'comlink';
	import Modal from '$lib/components/Modal.svelte';
	import { fluteParams, toneHoleParams } from '$lib/stores/fluteStore';
	import 'replicad-opencascadejs/src/replicad_single.wasm?url';

	export let open = false;
	export let onClose: () => void;

	type ExportState = 'generating' | 'complete';
	let state: ExportState = 'generating';
	
	let ReplicadViewer;
	let mesh = null;
	let cad = null;
	let error = null;
	let activeView: 'full' | number = 'full';

	onMount(async () => {
		try {
			console.log('Initializing replicad components...');
			ReplicadViewer = (await import('$lib/geometry/replicad/ReplicadViewer.svelte')).default;
			const CadWorker = (await import('$lib/geometry/replicad/worker?worker')).default;
			cad = wrap(new CadWorker());
			console.log('Replicad components initialized');
		} catch (e) {
			console.error('Failed to initialize replicad:', e);
			error = `Initialization failed: ${e?.message || String(e)}`;
		}
	});

	export async function startExport() {
		state = 'generating';
		error = null;
		mesh = null;
		await generateMesh();
	}

	async function generateMesh() {
		if (!cad || !$fluteParams || !$toneHoleParams) {
			console.error('Missing dependencies:', { cad: !!cad, fluteParams: !!$fluteParams, toneHoleParams: !!$toneHoleParams });
			return;
		}
		try {
			console.log('Starting mesh generation with params:', {
				boreDiameter: $fluteParams.boreDiameter,
				wallThickness: $fluteParams.wallThickness,
				fluteLength: $fluteParams.fluteLength,
				numberOfToneHoles: $fluteParams.numberOfToneHoles
			});
			mesh = await cad.createFluteMesh($fluteParams, $toneHoleParams);
			console.log('Mesh generation complete');
			state = 'complete';
		} catch (e) {
			console.error('Mesh generation failed:', e);
			error = e?.message || String(e);
			state = 'complete';
		}
	}

	async function downloadSTL() {
		if (!cad) return;
		try {
			console.log('Exporting STL...');
			const blob = await cad.exportFluteSTL($fluteParams, $toneHoleParams);
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = 'flute.stl';
			a.click();
			URL.revokeObjectURL(url);
			console.log('STL download complete');
		} catch (e) {
			console.error('STL export failed:', e);
			error = `STL export failed: ${e?.message || String(e)}`;
		}
	}

	async function downloadSTEP() {
		if (!cad) return;
		try {
			console.log('Exporting STEP...');
			const blob = await cad.exportFluteSTEP($fluteParams, $toneHoleParams);
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = 'flute.step';
			a.click();
			URL.revokeObjectURL(url);
			console.log('STEP download complete');
		} catch (e) {
			console.error('STEP export failed:', e);
			error = `STEP export failed: ${e?.message || String(e)}`;
		}
	}

	async function downloadPartsSTL() {
		if (!cad || !mesh?.parts) return;
		try {
			console.log('Exporting parts as STL...');
			const blobs = await cad.exportPartsSTL($fluteParams, $toneHoleParams);
			blobs.forEach((blob, index) => {
				const url = URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = `flute-part-${index + 1}.stl`;
				a.click();
				URL.revokeObjectURL(url);
			});
			console.log('Parts STL download complete');
		} catch (e) {
			console.error('Parts STL export failed:', e);
			error = `Parts STL export failed: ${e?.message || String(e)}`;
		}
	}

	async function downloadPartsSTEP() {
		if (!cad || !mesh?.parts) return;
		try {
			console.log('Exporting parts as STEP...');
			const blobs = await cad.exportPartsSTEP($fluteParams, $toneHoleParams);
			blobs.forEach((blob, index) => {
				const url = URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = `flute-part-${index + 1}.step`;
				a.click();
				URL.revokeObjectURL(url);
			});
			console.log('Parts STEP download complete');
		} catch (e) {
			console.error('Parts STEP export failed:', e);
			error = `Parts STEP export failed: ${e?.message || String(e)}`;
		}
	}

	function handleClose() {
		onClose();
		setTimeout(() => {
			state = 'generating';
			mesh = null;
			error = null;
			activeView = 'full';
		}, 300);
	}

	$: hasParts = mesh?.parts && mesh.parts.length > 0;
	$: currentMesh = activeView === 'full' 
		? { faces: mesh?.faces, edges: mesh?.edges }
		: mesh?.parts?.[activeView];

</script>

<Modal bind:open maxWidth="48rem" {onClose}>
	<div slot="header">
		<h2 class="modal-title">
			{#if state === 'generating'}
				Generating Export Files
			{:else}
				Export Complete
			{/if}
		</h2>
	</div>

	<div class="space-y-4">
		{#if error}
			<div class="alert-error">
				<strong>Error:</strong> {error}
			</div>
		{:else if state === 'generating'}
			<div class="min-h-96 flex items-center justify-center">
				<div class="flex flex-col items-center space-y-4">
					<div class="spinner"></div>
					<p class="text-gray-300 text-lg">Generating flute geometry...</p>
					<p class="text-gray-500 text-sm">This may take a few moments</p>
				</div>
			</div>
		{:else if mesh && ReplicadViewer}
			<div class="space-y-4">
				{#if hasParts}
					<div class="flex space-x-2 overflow-x-auto pb-2">
						<button 
							class="px-4 py-2 rounded transition-colors whitespace-nowrap {activeView === 'full' ? 'bg-primary-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}"
							on:click={() => activeView = 'full'}
						>
							Full Flute
						</button>
						{#each mesh.parts as _, index}
							<button 
								class="px-4 py-2 rounded transition-colors whitespace-nowrap {activeView === index ? 'bg-primary-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}"
								on:click={() => activeView = index}
							>
								Part {index + 1}
							</button>
						{/each}
					</div>
				{/if}
				
				<div class="h-96">
					{#if currentMesh}
						<svelte:component this={ReplicadViewer} faces={currentMesh.faces} edges={currentMesh.edges} />
					{/if}
				</div>
			</div>
		{/if}
	</div>

	<div slot="footer" class="flex justify-between items-center">
		<div class="flex space-x-3">
			{#if state === 'complete' && mesh}
				<button class="btn-secondary" on:click={downloadSTL}>
					Download Full STL
				</button>
				<button class="btn-secondary" on:click={downloadSTEP}>
					Download Full STEP
				</button>
				{#if hasParts}
					<button class="btn-secondary" on:click={downloadPartsSTL}>
						Download Parts STL
					</button>
					<button class="btn-secondary" on:click={downloadPartsSTEP}>
						Download Parts STEP
					</button>
				{/if}
			{/if}
		</div>
		<button class="btn-primary" on:click={handleClose}>
			{state === 'complete' ? 'Done' : 'Cancel'}
		</button>
	</div>
</Modal>
