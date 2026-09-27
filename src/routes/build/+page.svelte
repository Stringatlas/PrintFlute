<script lang="ts">
	import SideNav from '$lib/components/SideNav.svelte';
	import Preview3D from '$lib/components/generation/Preview3D.svelte';
	import Designer from '$lib/components/tabs/DesignerTab.svelte';
	import AudioAnalysis from '$lib/components/tabs/TunerTab.svelte';
	import TimbreAnalysis from '$lib/components/tabs/TimbreAnalysisTab.svelte';
	import LibraryTab from '$lib/components/tabs/LibraryTab.svelte';
	import type { Tab } from '$lib/components/SideNav.svelte';
	import { onMount } from 'svelte';
	import { findOfficialFlute } from '$lib/data/officialFlutes';
	import { libraryStore } from '$lib/stores/libraryStore';

	let currentTab: Tab = $state('library');
	let visited: Record<Tab, boolean> = $state({
		designer: false,
		library: true,
		tuner: false,
		timbre: false
	});

	$effect.pre(() => {
		visited[currentTab] = true;
	});

	onMount(() => {
		const params = new URLSearchParams(window.location.search);
		const design = params.get('design');
		const requestedTab = params.get('tab');
		if (design) {
			const entry = findOfficialFlute(design);
			if (entry) {
				libraryStore.loadDesign(entry);
				currentTab = 'designer';
				return;
			}
		}
		if (requestedTab === 'designer' || requestedTab === 'library' || requestedTab === 'tuner' || requestedTab === 'timbre') {
			currentTab = requestedTab;
		}
	});
</script>

<div class="flex h-screen bg-gray-950 pb-16 md:pb-0">
	<SideNav bind:currentTab />

	<main class="flex-1 flex overflow-hidden">
		<div class="flex-1 overflow-y-auto p-2 sm:p-4 md:p-6" class:hidden={currentTab !== 'designer'}>
			{#if visited.designer}
				<Designer />
			{/if}
		</div>

		<div class="flex-1 overflow-y-auto" class:hidden={currentTab !== 'library'}>
			{#if visited.library}
				<LibraryTab onOpenDesigner={() => currentTab = 'designer'} />
			{/if}
		</div>

		<div class="flex-1 overflow-y-auto p-2 sm:p-4 md:p-6" class:hidden={currentTab !== 'tuner'}>
			{#if visited.tuner}
				<AudioAnalysis />
			{/if}
		</div>

		<div class="flex-1 overflow-y-auto p-2 sm:p-4 md:p-6" class:hidden={currentTab !== 'timbre'}>
			{#if visited.timbre}
				<TimbreAnalysis />
			{/if}
		</div>

		{#if currentTab === 'designer'}
			<div class="hidden w-1/3 bg-gray-900 border-l border-gray-800 lg:block">
				<Preview3D />
			</div>
		{/if}
	</main>
</div>
