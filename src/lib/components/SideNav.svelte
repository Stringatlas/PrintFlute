<script lang="ts">
	import favicon from '$lib/assets/favicon.png';

	export type Tab = 'designer' | 'tuner' | 'timbre';
	
	let { currentTab = $bindable('designer') }: { currentTab: Tab } = $props();
	let isCollapsed = $state(false);

	const tabs: { id: Tab; label: string }[] = [
		{ id: 'designer', label: 'Flute Designer' },
		{ id: 'tuner', label: 'Tuner' },
		{ id: 'timbre', label: 'Timbre Analysis' }
	];

	function getTabIcon(tabId: Tab): string {
		switch (tabId) {
			case 'designer':
				return 'bi-pencil-fill';
			case 'tuner':
				return 'bi-music-note';
			case 'timbre':
				return 'bi-soundwave';
		}
	}
</script>

<nav class="{isCollapsed ? 'w-20' : 'w-64'} h-full bg-gray-900 border-r border-gray-800 flex flex-col transition-all duration-300">
	<div class="{isCollapsed ? 'p-3' : 'p-6'} border-b border-gray-800 flex justify-between items-start">
		<div class="flex-1 {isCollapsed ? 'hidden' : ''}">
            <div class="flex items-center gap-3 mb-4">
                <img src={favicon} alt="Print Flute Logo" class="h-12 w-auto" />
                <h1 class="text-2xl font-bold text-primary-400">Print Flute</h1>
            </div>
            <p class="text-sm text-gray-400 mt-1 text-center w-full">Design & Analysis for 3D Printed Flutes</p>
		</div>
		{#if isCollapsed}
			<img src={favicon} alt="Print Flute Logo" class="size-14 shrink-0 mx-auto" />
		{/if}
		<button
			class="text-gray-400 hover:text-gray-200 transition-colors {isCollapsed ? 'hidden' : ''}"
			onclick={() => isCollapsed = !isCollapsed}
			aria-label="Collapse sidebar"
		>
			<i class="bi bi-chevron-left"></i>
		</button>
	</div>

	{#if isCollapsed}
		<button
			class="px-6 py-3 text-gray-400 hover:text-gray-200 transition-colors"
			onclick={() => isCollapsed = !isCollapsed}
			aria-label="Expand sidebar"
		>
			<i class="bi bi-chevron-right"></i>
		</button>
	{/if}

	<div class="flex-1 py-4">
		{#each tabs as tab}
			<button
				class="w-full {isCollapsed ? 'px-6 py-4' : 'px-6 py-3'} {isCollapsed ? 'flex justify-center' : 'text-left flex items-center gap-3'} transition-all duration-200 {currentTab === tab.id
					? 'bg-primary-900/30 text-primary-400 border-l-4 border-primary-500'
					: 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}"
				onclick={() => (currentTab = tab.id)}
				aria-label={tab.label}
			>
				<i class="bi {getTabIcon(tab.id)} {isCollapsed ? 'text-xl' : ''}"></i>
				{#if !isCollapsed}
					<span>{tab.label}</span>
				{/if}
			</button>
		{/each}
	</div>

	<div class="p-6 border-t border-gray-800 {isCollapsed ? 'text-center' : ''}">
		<p class="text-xs text-gray-500">{'v0.1.0'}</p>
	</div>
</nav>
