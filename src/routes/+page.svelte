<script lang="ts">
	import SideNav from '$lib/components/SideNav.svelte';
	import Preview3D from '$lib/components/generation/Preview3D.svelte';
	import Designer from '$lib/components/tabs/DesignerTab.svelte';
	import AudioAnalysis from '$lib/components/tabs/TunerTab.svelte';
	import TimbreAnalysis from '$lib/components/tabs/TimbreAnalysisTab.svelte';
	import LibraryTab from '$lib/components/tabs/LibraryTab.svelte';
	import type { Tab } from '$lib/components/SideNav.svelte';

	let currentTab: Tab = $state('designer');
	let visitedTabs = $state(new Set<Tab>(['designer']));

	$effect(() => {
		visitedTabs.add(currentTab);
	});
</script>

<div class="flex h-screen bg-gray-950">
	<SideNav bind:currentTab />

	<main class="flex-1 flex overflow-hidden">
		<div class="flex-1 overflow-y-auto p-6" class:hidden={currentTab !== 'designer'}>
			{#if visitedTabs.has('designer')}
				<Designer />
			{/if}
		</div>

		<div class="flex-1 overflow-y-auto p-6" class:hidden={currentTab !== 'library'}>
			{#if visitedTabs.has('library')}
				<LibraryTab />
			{/if}
		</div>

		<div class="flex-1 overflow-y-auto p-6" class:hidden={currentTab !== 'tuner'}>
			{#if visitedTabs.has('tuner')}
				<AudioAnalysis />
			{/if}
		</div>

		<div class="flex-1 overflow-y-auto p-6" class:hidden={currentTab !== 'timbre'}>
			{#if visitedTabs.has('timbre')}
				<TimbreAnalysis />
			{/if}
		</div>

		{#if currentTab === 'designer'}
			<div class="w-1/3 bg-gray-900 border-l border-gray-800">
				<Preview3D />
			</div>
		{/if}
	</main>
</div>
