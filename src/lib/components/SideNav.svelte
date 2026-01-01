<script lang="ts">
	export type Tab = 'designer' | 'tuner' | 'timbre';
	
	let { currentTab = $bindable('designer') }: { currentTab: Tab } = $props();

	const tabs: { id: Tab; label: string }[] = [
		{ id: 'designer', label: 'Flute Designer' },
		{ id: 'tuner', label: 'Tuner' },
		{ id: 'timbre', label: 'Timbre Analysis' }
	];
</script>

<nav class="w-64 h-full bg-gray-900 border-r border-gray-800 flex flex-col">
	<div class="p-6 border-b border-gray-800">
		<h1 class="text-2xl font-bold text-primary-400">Flute Generator</h1>
		<p class="text-sm text-gray-400 mt-1">3D Design & Analysis</p>
	</div>

	<div class="flex-1 py-4">
		{#each tabs as tab}
			<button
				class="w-full px-6 py-3 text-left transition-colors duration-200 {currentTab === tab.id
					? 'bg-primary-900/30 text-primary-400 border-l-4 border-primary-500'
					: 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}"
				onclick={() => (currentTab = tab.id)}
			>
				{tab.label}
			</button>
		{/each}
	</div>

	<div class="p-6 border-t border-gray-800">
		<p class="text-xs text-gray-500">v0.1.0</p>
	</div>
</nav>
