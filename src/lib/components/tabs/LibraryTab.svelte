<script lang="ts">
	import PresetCard from '$lib/components/library/PresetCard.svelte';
	import SavePresetModal from '$lib/components/library/SavePresetModal.svelte';
	import EditPresetModal from '$lib/components/library/EditPresetModal.svelte';
	import DeletePresetModal from '$lib/components/library/DeletePresetModal.svelte';
	import { OFFICIAL_FLUTES } from '$lib/data/officialFlutes';
	import type { FluteLibraryEntry } from '$lib/domain/library';
	import { frequencyToNoteName } from '$lib/audio/musicTheory';
	import { libraryStore, type FlutePreset } from '$lib/stores/libraryStore';

	let { onOpenDesigner = () => {} }: { onOpenDesigner?: () => void } = $props();
	let showSaveModal = $state(false);
	let showDeleteModal = $state(false);
	let showEditModal = $state(false);
	let targetPreset: FlutePreset | null = $state(null);
	let searchQuery = $state('');
	let keyFilter = $state('All');

	let presets = $derived($libraryStore.presets);
	let activePresetId = $derived($libraryStore.activePresetId);
	let keys = $derived(['All', ...new Set(OFFICIAL_FLUTES.map((entry) => entry.metadata.key))]);

	function localEntry(preset: FlutePreset): FluteLibraryEntry {
		return {
			...preset,
			slug: `local-${preset.id}`,
			source: 'local',
			version: 1,
			visibility: 'private',
			metadata: {
				key: frequencyToNoteName(preset.fluteParameters.fundamentalFrequency),
				difficulty: 'intermediate',
				printFormat: preset.fluteParameters.numberOfCuts === 0 ? 'one-piece' : 'sectional',
				size: preset.fluteParameters.fundamentalFrequency >= 650 ? 'compact' : 'standard',
				character: 'Custom',
				tags: ['local', 'custom']
			}
		};
	}

	let localEntries = $derived(presets.map(localEntry));
	let filteredOfficial = $derived(OFFICIAL_FLUTES.filter(matchesFilters));
	let filteredLocal = $derived(localEntries.filter(matchesFilters));

	function matchesFilters(entry: FluteLibraryEntry): boolean {
		const query = searchQuery.trim().toLowerCase();
		const matchesKey = keyFilter === 'All' || entry.metadata.key === keyFilter;
		const matchesQuery = !query || [entry.name, entry.description, entry.metadata.key, ...entry.metadata.tags]
			.some((value) => value.toLowerCase().includes(query));
		return matchesKey && matchesQuery;
	}

	function useEntry(entry: FluteLibraryEntry) {
		if (entry.source === 'local') libraryStore.loadPreset(entry.id);
		else libraryStore.loadDesign(entry);
		onOpenDesigner();
	}

	function handleSave(name: string, description: string) {
		libraryStore.saveCurrentAsPreset(name, description);
		showSaveModal = false;
	}

	function handleEdit(name: string, description: string) {
		if (!targetPreset) return;
		libraryStore.renamePreset(targetPreset.id, name);
		if (description !== targetPreset.description) libraryStore.updatePresetDescription(targetPreset.id, description);
		showEditModal = false;
		targetPreset = null;
	}

	function handleDelete() {
		if (!targetPreset) return;
		libraryStore.deletePreset(targetPreset.id);
		showDeleteModal = false;
		targetPreset = null;
	}

	function exportPreset(preset: FlutePreset) {
		const blob = new Blob([JSON.stringify(preset, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement('a');
		anchor.href = url;
		anchor.download = `${preset.name.replace(/\s+/g, '-').toLowerCase()}.json`;
		anchor.click();
		URL.revokeObjectURL(url);
	}

	function importPreset() {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = '.json';
		input.onchange = async (event) => {
			const file = (event.target as HTMLInputElement).files?.[0];
			if (!file) return;
			try {
				const data = JSON.parse(await file.text()) as FlutePreset;
				if (!data.fluteParameters || !data.toneHoleParameters) return;
				libraryStore.saveCurrentAsPreset(data.name || file.name.replace('.json', ''), data.description || '');
				const state = $libraryStore;
				const created = state.presets[state.presets.length - 1];
				if (created) libraryStore.overwriteWithData(created.id, data.fluteParameters, data.toneHoleParameters);
			} catch {
				// Invalid or incomplete parameter file.
			}
		};
		input.click();
	}
</script>

<div class="mx-auto max-w-7xl space-y-10 px-4 py-6 sm:px-6 md:py-10">
	<header class="flex flex-col gap-6 border-b border-gray-800 pb-8 lg:flex-row lg:items-end lg:justify-between">
		<div class="max-w-2xl">
			<p class="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary-400">Flute library</p>
			<h2 class="text-3xl font-semibold tracking-tight text-gray-100 sm:text-4xl">Start with an instrument, not a settings screen.</h2>
			<p class="mt-3 max-w-xl leading-7 text-gray-400">Choose a ready-made design, generate it on this device, then adjust only what you need.</p>
		</div>
		<div class="flex flex-wrap gap-3">
			<button class="btn-secondary" onclick={importPreset}><i class="bi bi-upload"></i> Import parameters</button>
			<button class="btn-primary" onclick={() => showSaveModal = true}><i class="bi bi-plus-lg"></i> Save current design</button>
		</div>
	</header>

	<div class="flex flex-col gap-4 rounded-2xl border border-gray-800 bg-gray-900/50 p-4 md:flex-row md:items-center">
		<label class="relative min-w-0 flex-1">
			<span class="sr-only">Search flute library</span>
			<i class="bi bi-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"></i>
			<input class="input min-h-11 w-full pl-11" bind:value={searchQuery} placeholder="Search by name, key, or playing character" />
		</label>
		<div class="flex flex-wrap gap-2" aria-label="Filter by key">
			{#each keys as key}
				<button class="rounded-full border px-3 py-2 text-xs transition {keyFilter === key ? 'border-primary-500 bg-primary-950 text-primary-300' : 'border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-200'}" onclick={() => keyFilter = key}>{key}</button>
			{/each}
		</div>
	</div>

	<section class="space-y-5">
		<div class="flex items-end justify-between gap-4">
			<div><h3 class="text-xl font-semibold text-gray-100">Print Flute designs</h3><p class="mt-1 text-sm text-gray-500">Curated starting points included with the app.</p></div>
			<span class="text-xs text-gray-600">{filteredOfficial.length} designs</span>
		</div>
		{#if filteredOfficial.length}
			<div class="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
				{#each filteredOfficial as entry (entry.id)}
					<PresetCard {entry} onUse={() => useEntry(entry)} onSaveCopy={() => libraryStore.saveDesignAsPreset(entry)} />
				{/each}
			</div>
		{:else}
			<p class="rounded-xl border border-dashed border-gray-800 p-8 text-center text-sm text-gray-500">No provided designs match these filters.</p>
		{/if}
	</section>

	<section class="space-y-5 border-t border-gray-800 pt-9">
		<div><h3 class="text-xl font-semibold text-gray-100">Your designs</h3><p class="mt-1 text-sm text-gray-500">Saved in this browser. Nothing is uploaded.</p></div>
		{#if filteredLocal.length}
			<div class="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
				{#each filteredLocal as entry (entry.id)}
					{@const preset = presets.find((item) => item.id === entry.id)!}
					<PresetCard {entry} isActive={activePresetId === entry.id} onUse={() => useEntry(entry)} onOverwrite={() => libraryStore.updatePreset(entry.id)} onDuplicate={() => libraryStore.duplicatePreset(entry.id)} onExport={() => exportPreset(preset)} onEdit={() => { targetPreset = preset; showEditModal = true; }} onDelete={() => { targetPreset = preset; showDeleteModal = true; }} />
				{/each}
			</div>
		{:else if presets.length === 0}
			<div class="flex flex-col items-start justify-between gap-4 rounded-2xl border border-dashed border-gray-700 bg-gray-900/30 p-6 sm:flex-row sm:items-center">
				<div><h4 class="font-medium text-gray-200">No saved designs yet</h4><p class="mt-1 text-sm text-gray-500">Save an included flute or keep a custom design here.</p></div>
				<button class="btn-secondary shrink-0" onclick={() => showSaveModal = true}>Save current design</button>
			</div>
		{:else}
			<p class="rounded-xl border border-dashed border-gray-800 p-8 text-center text-sm text-gray-500">No saved designs match these filters.</p>
		{/if}
	</section>
</div>

<SavePresetModal open={showSaveModal} onClose={() => showSaveModal = false} onSave={handleSave} />
<EditPresetModal open={showEditModal} preset={targetPreset} onClose={() => { showEditModal = false; targetPreset = null; }} onSave={handleEdit} />
<DeletePresetModal open={showDeleteModal} presetName={targetPreset?.name ?? ''} onClose={() => { showDeleteModal = false; targetPreset = null; }} onConfirm={handleDelete} />
