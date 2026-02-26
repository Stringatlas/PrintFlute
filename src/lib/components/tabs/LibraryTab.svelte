<script lang="ts">
	import Tooltip from '$lib/components/generation/form-elements/Tooltip.svelte';
	import PresetCard from '$lib/components/library/PresetCard.svelte';
	import SavePresetModal from '$lib/components/library/SavePresetModal.svelte';
	import EditPresetModal from '$lib/components/library/EditPresetModal.svelte';
	import DeletePresetModal from '$lib/components/library/DeletePresetModal.svelte';
	import { libraryStore, type FlutePreset } from '$lib/stores/libraryStore';

	let showSaveModal = $state(false);
	let showDeleteModal = $state(false);
	let showEditModal = $state(false);
	let targetPreset: FlutePreset | null = $state(null);

	let sortBy: 'name' | 'date' = $state('date');
	let searchQuery = $state('');

	let presets = $derived($libraryStore.presets);
	let activePresetId = $derived($libraryStore.activePresetId);

	let filteredPresets = $derived(
		presets
			.filter(p => {
				const query = searchQuery.toLowerCase();
				return p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query);
			})
			.sort((a, b) => {
				if (sortBy === 'name') return a.name.localeCompare(b.name);
				return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
			})
	);

	function handleSave(name: string, description: string) {
		libraryStore.saveCurrentAsPreset(name, description);
		showSaveModal = false;
	}

	function handleEdit(name: string, description: string) {
		if (!targetPreset) return;
		libraryStore.renamePreset(targetPreset.id, name);
		if (description !== targetPreset.description) {
			libraryStore.updatePresetDescription(targetPreset.id, description);
		}
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
		const data = JSON.stringify(preset, null, 2);
		const blob = new Blob([data], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${preset.name.replace(/\s+/g, '-').toLowerCase()}.json`;
		a.click();
		URL.revokeObjectURL(url);
	}

	function importPreset() {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = '.json';
		input.onchange = async (e) => {
			const file = (e.target as HTMLInputElement).files?.[0];
			if (!file) return;
			try {
				const text = await file.text();
				const data = JSON.parse(text) as FlutePreset;
				if (!data.fluteParameters || !data.toneHoleParameters) return;
				libraryStore.saveCurrentAsPreset(data.name || file.name.replace('.json', ''), data.description || '');
				const state = $libraryStore;
				const created = state.presets[state.presets.length - 1];
				if (created) {
					libraryStore.overwriteWithData(created.id, data.fluteParameters, data.toneHoleParameters);
				}
			} catch {
				// Invalid file
			}
		};
		input.click();
	}
</script>

<div class="space-y-6 p-4 sm:p-6 md:p-8">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-2">
			<h2 class="heading-page">Flute Library</h2>
			<Tooltip text="Save, load, and manage flute parameter presets. Export as JSON to share designs." type="info" />
		</div>
		<div class="flex items-center gap-2">
			<button class="btn-secondary btn-sm" onclick={importPreset}>
				<i class="bi bi-upload"></i>
				Import
			</button>
			<button class="btn-primary btn-sm" onclick={() => showSaveModal = true}>
				<i class="bi bi-plus-lg"></i>
				Save Current
			</button>
		</div>
	</div>

	{#if presets.length > 0}
		<div class="flex items-center gap-3">
			<div class="relative flex-1">
				<i class="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm"></i>
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Search presets..."
					class="input w-full pl-9"
				/>
			</div>
			<div class="flex rounded-lg bg-gray-800 p-1 border border-gray-700">
				<button
					onclick={() => sortBy = 'date'}
					class="px-3 py-1 text-sm rounded transition-colors duration-200 {sortBy === 'date'
						? 'bg-primary-600 text-white'
						: 'text-gray-400 hover:text-gray-200'}"
				>
					Recent
				</button>
				<button
					onclick={() => sortBy = 'name'}
					class="px-3 py-1 text-sm rounded transition-colors duration-200 {sortBy === 'name'
						? 'bg-primary-600 text-white'
						: 'text-gray-400 hover:text-gray-200'}"
				>
					Name
				</button>
			</div>
		</div>
	{/if}

	{#if filteredPresets.length === 0 && presets.length === 0}
		<div class="flex flex-col items-center justify-center py-20 text-center">
			<i class="bi bi-collection text-5xl text-gray-600 mb-4"></i>
			<h3 class="text-lg font-medium text-gray-300 mb-2">No saved presets</h3>
			<p class="text-sm text-gray-500 mb-6 max-w-sm">
				Design a flute in the Designer tab, then save it here to build your collection.
			</p>
			<button class="btn-primary" onclick={() => showSaveModal = true}>
				<i class="bi bi-plus-lg"></i>
				Save Current Design
			</button>
		</div>
	{:else if filteredPresets.length === 0}
		<div class="flex flex-col items-center justify-center py-12 text-center">
			<i class="bi bi-search text-3xl text-gray-600 mb-3"></i>
			<p class="text-sm text-gray-500">No presets match "{searchQuery}"</p>
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
			{#each filteredPresets as preset (preset.id)}
				<PresetCard
					{preset}
					isActive={activePresetId === preset.id}
					onLoad={() => libraryStore.loadPreset(preset.id)}
					onOverwrite={() => libraryStore.updatePreset(preset.id)}
					onDuplicate={() => libraryStore.duplicatePreset(preset.id)}
					onExport={() => exportPreset(preset)}
					onEdit={() => { targetPreset = preset; showEditModal = true; }}
					onDelete={() => { targetPreset = preset; showDeleteModal = true; }}
				/>
			{/each}
		</div>
	{/if}
</div>

<SavePresetModal
	open={showSaveModal}
	onClose={() => showSaveModal = false}
	onSave={handleSave}
/>

<EditPresetModal
	open={showEditModal}
	preset={targetPreset}
	onClose={() => { showEditModal = false; targetPreset = null; }}
	onSave={handleEdit}
/>

<DeletePresetModal
	open={showDeleteModal}
	presetName={targetPreset?.name ?? ''}
	onClose={() => { showDeleteModal = false; targetPreset = null; }}
	onConfirm={handleDelete}
/>
