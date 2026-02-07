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

	function handleClose() {
		onClose();
		setTimeout(() => {
			state = 'generating';
			mesh = null;
			error = null;
		}, 300);
	}
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
			<div class="p-4 bg-red-100 text-red-800 rounded-lg">
				<strong>Error:</strong> {error}
			</div>
		{:else if state === 'generating'}
			<div class="min-h-96 flex items-center justify-center">
				<div class="flex flex-col items-center space-y-4">
					<div class="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
					<p class="text-neutral-300 text-lg">Generating flute geometry...</p>
					<p class="text-neutral-500 text-sm">This may take a few moments</p>
				</div>
			</div>
		{:else if mesh && ReplicadViewer}
			<div class="space-y-4">
				<div class="h-96">
					<svelte:component this={ReplicadViewer} faces={mesh.faces} edges={mesh.edges} />
				</div>
				<div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm p-4 bg-neutral-800 rounded">
					<div>
						<span class="text-neutral-400">Bore:</span>
						<span class="font-medium">{$fluteParams?.boreDiameter ?? 0}mm</span>
					</div>
					<div>
						<span class="text-neutral-400">Wall:</span>
						<span class="font-medium">{$fluteParams?.wallThickness ?? 0}mm</span>
					</div>
					<div>
						<span class="text-neutral-400">Length:</span>
						<span class="font-medium">{$fluteParams?.fluteLength ?? 0}mm</span>
					</div>
					<div>
						<span class="text-neutral-400">Holes:</span>
						<span class="font-medium">{$fluteParams?.numberOfToneHoles ?? 0}</span>
					</div>
				</div>
			</div>
		{/if}
	</div>

	<div slot="footer" class="flex justify-between items-center">
		<div class="flex space-x-3">
			{#if state === 'complete' && mesh}
				<button class="btn-secondary" on:click={downloadSTL}>
					Download STL
				</button>
				<button class="btn-secondary" on:click={downloadSTEP}>
					Download STEP
				</button>
			{/if}
		</div>
		<button class="btn-primary" on:click={handleClose}>
			{state === 'complete' ? 'Done' : 'Cancel'}
		</button>
	</div>
</Modal>
