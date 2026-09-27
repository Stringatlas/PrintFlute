<script lang="ts">
	import type { FluteLibraryEntry } from '$lib/domain/library';

	let {
		entry,
		isActive = false,
		onUse,
		onSaveCopy,
		onOverwrite,
		onDuplicate,
		onExport,
		onEdit,
		onDelete
	}: {
		entry: FluteLibraryEntry;
		isActive?: boolean;
		onUse: () => void;
		onSaveCopy?: () => void;
		onOverwrite?: () => void;
		onDuplicate?: () => void;
		onExport?: () => void;
		onEdit?: () => void;
		onDelete?: () => void;
	} = $props();

	let isOfficial = $derived(entry.source === 'official');
	let hasMenu = $derived(Boolean(onSaveCopy || onOverwrite || onDuplicate || onExport || onEdit || onDelete));

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
	}
</script>

<article class="group relative flex min-h-72 flex-col overflow-visible rounded-2xl border bg-gray-900/65 p-5 transition {isActive ? 'border-primary-500 shadow-[0_0_0_1px_rgba(16,185,129,.2)]' : 'border-gray-800 hover:border-gray-700'}">
	<div class="mb-5 flex items-start justify-between gap-4">
		<div class="min-w-0">
			<div class="mb-2 flex items-center gap-2">
				<span class="text-xs font-medium uppercase tracking-[0.16em] text-primary-400">{entry.metadata.key}</span>
				<span class="text-gray-700">/</span>
				<span class="text-xs capitalize text-gray-400">{entry.metadata.character}</span>
			</div>
			<h3 class="text-xl font-semibold tracking-tight text-gray-100">{entry.name}</h3>
		</div>

		{#if hasMenu}
			<details class="relative z-10">
				<summary class="flex size-9 cursor-pointer list-none items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-800 hover:text-gray-200" aria-label="More actions for {entry.name}">
					<i class="bi bi-three-dots"></i>
				</summary>
				<div class="absolute right-0 top-10 z-20 w-56 overflow-hidden rounded-xl border border-gray-700 bg-gray-900 p-1.5 shadow-2xl">
					{#if onSaveCopy}<button class="menu-action" onclick={onSaveCopy}><i class="bi bi-bookmark"></i> Save to your library</button>{/if}
					{#if onOverwrite}<button class="menu-action" onclick={onOverwrite}><i class="bi bi-arrow-repeat"></i> Update from current design</button>{/if}
					{#if onDuplicate}<button class="menu-action" onclick={onDuplicate}><i class="bi bi-copy"></i> Duplicate</button>{/if}
					{#if onExport}<button class="menu-action" onclick={onExport}><i class="bi bi-download"></i> Export parameters</button>{/if}
					{#if onEdit}<button class="menu-action" onclick={onEdit}><i class="bi bi-pencil"></i> Rename and describe</button>{/if}
					{#if onDelete}<button class="menu-action danger" onclick={onDelete}><i class="bi bi-trash3"></i> Delete design</button>{/if}
				</div>
			</details>
		{/if}
	</div>

	<p class="mb-5 text-sm leading-6 text-gray-400">{entry.description}</p>

	<div class="mb-5 grid grid-cols-3 divide-x divide-gray-800 rounded-xl border border-gray-800 bg-gray-950/60 py-3">
		<div class="px-3"><div class="text-[0.65rem] uppercase tracking-wider text-gray-600">Holes</div><div class="mt-1 text-sm text-gray-200">{entry.fluteParameters.numberOfToneHoles}</div></div>
		<div class="px-3"><div class="text-[0.65rem] uppercase tracking-wider text-gray-600">Size</div><div class="mt-1 text-sm capitalize text-gray-200">{entry.metadata.size}</div></div>
		<div class="px-3"><div class="text-[0.65rem] uppercase tracking-wider text-gray-600">Print</div><div class="mt-1 text-sm text-gray-200">{entry.metadata.printFormat === 'one-piece' ? 'One piece' : 'Sectional'}</div></div>
	</div>

	<div class="mt-auto flex items-center gap-3">
		<button class="btn-primary min-h-11 flex-1" onclick={onUse}>Use design <i class="bi bi-arrow-right"></i></button>
		{#if isActive}<span class="rounded-full border border-primary-800 bg-primary-950/70 px-3 py-2 text-xs text-primary-300">In editor</span>{/if}
	</div>
	<div class="mt-3 text-xs text-gray-600">{isOfficial ? 'Provided by Print Flute' : `Saved ${formatDate(entry.updatedAt)}`}</div>
</article>

<style>
	.menu-action { width: 100%; display: flex; align-items: center; gap: 0.65rem; border-radius: 0.5rem; padding: 0.65rem 0.75rem; text-align: left; font-size: 0.8rem; color: rgb(209 213 219); transition: background-color 150ms ease; }
	.menu-action:hover { background: rgb(31 41 55); }
	.menu-action.danger { color: rgb(248 113 113); }
	.menu-action.danger:hover { background: rgb(69 10 10 / 0.4); }
	details[open] summary { background: rgb(31 41 55); color: rgb(229 231 235); }
	summary::-webkit-details-marker { display: none; }
</style>
