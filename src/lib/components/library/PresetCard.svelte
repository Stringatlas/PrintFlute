<script lang="ts">
	import Tooltip from '$lib/components/generation/form-elements/Tooltip.svelte';
	import { frequencyToNoteName } from '$lib/audio/musicTheory';
	import type { FlutePreset } from '$lib/stores/libraryStore';

    // TODO: Update card actions UI (simplify)
    // TODO: Redirect edit action to designer tab

	let {
		preset,
		isActive = false,
		onLoad,
		onOverwrite,
		onDuplicate,
		onExport,
		onEdit,
		onDelete,
	}: {
		preset: FlutePreset;
		isActive?: boolean;
		onLoad: () => void;
		onOverwrite: () => void;
		onDuplicate: () => void;
		onExport: () => void;
		onEdit: () => void;
		onDelete: () => void;
	} = $props();

	let note = $derived(frequencyToNoteName(preset.fluteParameters.fundamentalFrequency));

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleDateString(undefined, {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	}

	function getPresetSummary(): string {
		const p = preset.fluteParameters;
		const t = preset.toneHoleParameters;
		const holeInfo = Array.from({ length: p.numberOfToneHoles }, (_, i) => {
			const diameter = t.holeDiameters[i] || 0;
			return `  Hole ${i + 1}: ${diameter}mm`;
		}).join('\n');

		return [
			`Bore: ${p.boreDiameter}mm`,
			`Wall: ${p.wallThickness}mm`,
			`Embouchure: ${p.embouchureHoleLength}x${p.embouchureHoleWidth}mm`,
			`Fundamental: ${p.fundamentalFrequency.toFixed(2)}Hz`,
			`Holes: ${p.numberOfToneHoles}`,
			`Length: ${p.fluteLength.toFixed(1)}mm`,
			holeInfo,
		].join('\n');
	}
</script>

<div class="card group relative flex flex-col {isActive ? 'border-primary-500 bg-primary-900/10' : ''}">
	<div class="flex items-start justify-between mb-3">
		<div class="flex-1 min-w-0">
			<div class="flex items-center gap-2">
				<h3 class="text-sm font-semibold text-gray-200 truncate">{preset.name}</h3>
				{#if isActive}
					<span class="badge-success shrink-0">Active</span>
				{/if}
				<Tooltip text={getPresetSummary()} type="info" />
			</div>
			{#if preset.description}
				<p class="text-xs text-gray-500 mt-1 line-clamp-2">{preset.description}</p>
			{/if}
		</div>
	</div>

	<div class="grid grid-cols-3 gap-2 mb-3">
		<div class="bg-gray-900/50 rounded px-2 py-1.5">
			<div class="text-xs text-gray-500">Key</div>
			<div class="text-sm font-medium text-primary-400">{note}</div>
		</div>
		<div class="bg-gray-900/50 rounded px-2 py-1.5">
			<div class="text-xs text-gray-500">Bore</div>
			<div class="text-sm font-medium text-gray-300">{preset.fluteParameters.boreDiameter}mm</div>
		</div>
		<div class="bg-gray-900/50 rounded px-2 py-1.5">
			<div class="text-xs text-gray-500">Holes</div>
			<div class="text-sm font-medium text-gray-300">{preset.fluteParameters.numberOfToneHoles}</div>
		</div>
	</div>

	<div class="flex items-center justify-between mt-auto pt-3 border-t border-gray-700/50">
		<span class="text-xs text-gray-600">{formatDate(preset.updatedAt)}</span>
		<div class="flex items-center gap-1">
			<button
				class="btn-icon text-gray-500 hover:text-primary-400"
				onclick={onLoad}
				aria-label="Load preset"
				title="Load"
			>
				<i class="bi bi-box-arrow-in-down text-sm"></i>
			</button>
			<button
				class="btn-icon text-gray-500 hover:text-primary-400"
				onclick={onOverwrite}
				aria-label="Overwrite with current parameters"
				title="Overwrite"
			>
				<i class="bi bi-arrow-repeat text-sm"></i>
			</button>
			<button
				class="btn-icon text-gray-500 hover:text-primary-400"
				onclick={onDuplicate}
				aria-label="Duplicate preset"
				title="Duplicate"
			>
				<i class="bi bi-copy text-sm"></i>
			</button>
			<button
				class="btn-icon text-gray-500 hover:text-primary-400"
				onclick={onExport}
				aria-label="Export as JSON"
				title="Export"
			>
				<i class="bi bi-download text-sm"></i>
			</button>
			<button
				class="btn-icon text-gray-500 hover:text-gray-200"
				onclick={onEdit}
				aria-label="Edit preset"
				title="Edit"
			>
				<i class="bi bi-pencil text-sm"></i>
			</button>
			<button
				class="btn-icon text-gray-500 hover:text-red-400"
				onclick={onDelete}
				aria-label="Delete preset"
				title="Delete"
			>
				<i class="bi bi-trash3 text-sm"></i>
			</button>
		</div>
	</div>
</div>
