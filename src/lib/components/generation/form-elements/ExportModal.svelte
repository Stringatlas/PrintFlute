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
	let exportScope: 'full' | 'parts' = 'full';
	let exporting: string | null = null;

	onMount(async () => {
		try {
			ReplicadViewer = (await import('$lib/geometry/replicad/ReplicadViewer.svelte')).default;
			const CadWorker = (await import('$lib/geometry/replicad/worker?worker')).default;
			cad = wrap(new CadWorker());
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
		if (!cad || !$fluteParams || !$toneHoleParams) return;
		try {
			mesh = await cad.createFluteMesh($fluteParams, $toneHoleParams);
			state = 'complete';
		} catch (e) {
			console.error('Mesh generation failed:', e);
			error = e?.message || String(e);
			state = 'complete';
		}
	}

	async function downloadSTL() {
		if (!cad || exporting) return;
		exporting = 'stl';
		try {
			const blob = await cad.exportFluteSTL($fluteParams, $toneHoleParams);
			triggerDownload(blob, 'flute.stl');
		} catch (e) {
			error = `STL export failed: ${e?.message || String(e)}`;
		} finally {
			exporting = null;
		}
	}

	async function downloadSTEP() {
		if (!cad || exporting) return;
		exporting = 'step';
		try {
			const blob = await cad.exportFluteSTEP($fluteParams, $toneHoleParams);
			triggerDownload(blob, 'flute.step');
		} catch (e) {
			error = `STEP export failed: ${e?.message || String(e)}`;
		} finally {
			exporting = null;
		}
	}

	async function downloadPartsSTL() {
		if (!cad || !mesh?.parts || exporting) return;
		exporting = 'parts-stl';
		try {
			const blobs = await cad.exportPartsSTL($fluteParams, $toneHoleParams);
			blobs.forEach((blob, index) => {
				triggerDownload(blob, `flute-part-${index + 1}.stl`);
			});
		} catch (e) {
			error = `Parts STL export failed: ${e?.message || String(e)}`;
		} finally {
			exporting = null;
		}
	}

	async function downloadPartsSTEP() {
		if (!cad || !mesh?.parts || exporting) return;
		exporting = 'parts-step';
		try {
			const blobs = await cad.exportPartsSTEP($fluteParams, $toneHoleParams);
			blobs.forEach((blob, index) => {
				triggerDownload(blob, `flute-part-${index + 1}.step`);
			});
		} catch (e) {
			error = `Parts STEP export failed: ${e?.message || String(e)}`;
		} finally {
			exporting = null;
		}
	}

	function handleDownloadSTL() {
		if (exportScope === 'full') downloadSTL();
		else downloadPartsSTL();
	}

	function handleDownloadSTEP() {
		if (exportScope === 'full') downloadSTEP();
		else downloadPartsSTEP();
	}

	function triggerDownload(blob: Blob, filename: string) {
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		a.click();
		URL.revokeObjectURL(url);
	}

	function handleClose() {
		onClose();
		setTimeout(() => {
			state = 'generating';
			mesh = null;
			error = null;
			activeView = 'full';
			exportScope = 'full';
			exporting = null;
		}, 300);
	}

	$: hasParts = mesh?.parts && mesh.parts.length > 0;
	$: currentMesh = activeView === 'full'
		? { faces: mesh?.faces, edges: mesh?.edges }
		: mesh?.parts?.[activeView];
	$: activeExportKey = exportScope === 'full' ? 'stl' : 'parts-stl';
	$: activeStepKey = exportScope === 'full' ? 'step' : 'parts-step';
</script>

<Modal bind:open maxWidth="48rem" {onClose}>
	<div slot="header">
		<h2 class="modal-title">
			{#if state === 'generating'}
				<i class="bi bi-gear-wide-connected me-2"></i>Generating Model
			{:else}
				<i class="bi bi-check-circle me-2"></i>Export Ready
			{/if}
		</h2>
	</div>

	<div class="space-y-4">
		{#if error}
			<div class="alert-error">
				<i class="bi bi-exclamation-triangle"></i> {error}
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
					<div class="toggle-group">
						<button
							class={activeView === 'full' ? 'toggle-btn-active' : 'toggle-btn'}
							on:click={() => activeView = 'full'}
						>
							<i class="bi bi-box"></i> Full Flute
						</button>
						{#each mesh.parts as _, index}
							<button
								class={activeView === index ? 'toggle-btn-active' : 'toggle-btn'}
								on:click={() => activeView = index}
							>
								<i class="bi bi-subtract"></i> Part {index + 1}
							</button>
						{/each}
					</div>
				{/if}

				<div class="h-96 rounded-lg overflow-hidden border border-gray-700">
					{#if currentMesh}
						<svelte:component this={ReplicadViewer} faces={currentMesh.faces} edges={currentMesh.edges} />
					{/if}
				</div>

				{#if state === 'complete' && mesh}
					<div class="rounded-lg border border-gray-700 bg-gray-800/50 overflow-hidden">
						<div class="flex items-center justify-between px-4 py-3 border-b border-gray-700">
							<span class="text-sm font-medium text-gray-300 flex items-center gap-2">
								<i class="bi bi-download"></i> Download
							</span>
							{#if hasParts}
								<div class="toggle-group">
									<button
										class={exportScope === 'full' ? 'toggle-btn-active' : 'toggle-btn'}
										on:click={() => exportScope = 'full'}
									>
										<i class="bi bi-box"></i> Full Flute
									</button>
									<button
										class={exportScope === 'parts' ? 'toggle-btn-active' : 'toggle-btn'}
										on:click={() => exportScope = 'parts'}
									>
										<i class="bi bi-boxes"></i> Separate Parts
									</button>
								</div>
							{/if}
						</div>
						<div class="grid grid-cols-2 gap-3 p-4">
							<button
								class="flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-700/50 border border-gray-600 text-gray-200 transition-all duration-200 hover:bg-primary-600/20 hover:border-primary-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
								on:click={handleDownloadSTL}
								disabled={!!exporting}
							>
								{#if exporting === activeExportKey}
									<span class="inline-block w-4 h-4 border-2 border-gray-400 border-t-white rounded-full animate-spin"></span>
									Exporting...
								{:else}
									<i class="bi bi-filetype-raw text-xl text-primary-400"></i>
									<span class="flex flex-col items-start leading-tight">
										<strong class="text-sm">STL</strong>
										<small class="text-xs text-gray-400">3D printing</small>
									</span>
								{/if}
							</button>
							<button
								class="flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-700/50 border border-gray-600 text-gray-200 transition-all duration-200 hover:bg-primary-600/20 hover:border-primary-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
								on:click={handleDownloadSTEP}
								disabled={!!exporting}
							>
								{#if exporting === activeStepKey}
									<span class="inline-block w-4 h-4 border-2 border-gray-400 border-t-white rounded-full animate-spin"></span>
									Exporting...
								{:else}
									<i class="bi bi-vector-pen text-xl text-primary-400"></i>
									<span class="flex flex-col items-start leading-tight">
										<strong class="text-sm">STEP</strong>
										<small class="text-xs text-gray-400">CAD editing</small>
									</span>
								{/if}
							</button>
						</div>
					</div>
				{/if}
			</div>
		{/if}
	</div>

	<div slot="footer">
		<button class="btn-primary" on:click={handleClose}>
			<i class="bi bi-{state === 'complete' ? 'check-lg' : 'x-lg'}"></i>
			{state === 'complete' ? 'Done' : 'Cancel'}
		</button>
	</div>
</Modal>
