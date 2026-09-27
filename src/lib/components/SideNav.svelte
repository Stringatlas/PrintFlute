<script lang="ts">
	import favicon from '$lib/assets/favicon.png';

	export type Tab = 'designer' | 'tuner' | 'timbre' | 'library';
	
	let { currentTab = $bindable('designer') }: { currentTab: Tab } = $props();
	let isCollapsed = $state(false);

	const tabs: { id: Tab; label: string }[] = [
		{ id: 'library', label: 'Flute Library' },
		{ id: 'designer', label: 'Custom Design' },
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
			case 'library':
				return 'bi-collection-fill';
		}
	}
</script>

<nav class="fixed inset-x-0 bottom-0 z-50 flex h-16 w-full flex-col border-t border-gray-800 bg-gray-900 transition-all duration-300 md:static md:h-full md:border-r md:border-t-0 {isCollapsed ? 'md:w-20' : 'md:w-64'}">
	<div class="hidden {isCollapsed ? 'p-3' : 'p-6'} border-b border-gray-800 justify-between items-start md:flex">
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
			class="hidden px-6 py-3 text-gray-400 hover:text-gray-200 transition-colors md:block"
			onclick={() => isCollapsed = !isCollapsed}
			aria-label="Expand sidebar"
		>
			<i class="bi bi-chevron-right"></i>
		</button>
	{/if}

	<div class="flex flex-1 py-1 md:block md:py-4">
		{#each tabs as tab}
			<button
				class="flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 py-2 text-center text-[0.65rem] transition-all duration-200 md:w-full md:flex-row md:justify-start md:gap-3 md:text-left md:text-base {isCollapsed ? 'md:px-6 md:py-4 md:justify-center' : 'md:px-6 md:py-3'} {currentTab === tab.id
					? 'bg-primary-900/30 text-primary-400 md:border-l-4 md:border-primary-500'
					: 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}"
				onclick={() => (currentTab = tab.id)}
				aria-label={tab.label}
			>
				<i class="bi {getTabIcon(tab.id)} text-base {isCollapsed ? 'md:text-xl' : ''}"></i>
				{#if !isCollapsed}
					<span>{tab.label}</span>
				{:else}
					<span class="md:hidden">{tab.label}</span>
				{/if}
			</button>
		{/each}
	</div>

	<div class="hidden p-6 border-t border-gray-800 md:block {isCollapsed ? 'text-center' : ''}">
		<p class="text-xs text-gray-500">{'v0.1.0'}</p>
	</div>
</nav>
