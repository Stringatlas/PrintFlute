<script lang="ts">
	import SideNav from '$lib/components/SideNav.svelte';
	import Preview3D from '$lib/components/generation/Preview3D.svelte';
	import Designer from '$lib/components/tabs/DesignerTab.svelte';
	import AudioAnalysis from '$lib/components/tabs/TunerTab.svelte';
	import TimbreAnalysis from '$lib/components/tabs/TimbreAnalysisTab.svelte';
	import LibraryTab from '$lib/components/tabs/LibraryTab.svelte';
	import type { Tab } from '$lib/components/SideNav.svelte';

    // TODO: First load welcome screen
	let currentTab: Tab = $state('designer');
	let visited: Record<Tab, boolean> = $state({
		designer: true,
		library: false,
		tuner: false,
		timbre: false
	});

	$effect.pre(() => {
		visited[currentTab] = true;
	});
</script>

<div class="flex h-screen bg-gray-950">
	<SideNav bind:currentTab />

	<main class="flex-1 flex overflow-hidden">
		<div class="flex-1 overflow-y-auto p-6" class:hidden={currentTab !== 'designer'}>
			{#if visited.designer}
				<Designer />
			{/if}
		</div>

		<div class="flex-1 overflow-y-auto p-6" class:hidden={currentTab !== 'library'}>
			{#if visited.library}
				<LibraryTab />
			{/if}
		</div>

		<div class="flex-1 overflow-y-auto p-6" class:hidden={currentTab !== 'tuner'}>
			{#if visited.tuner}
				<AudioAnalysis />
			{/if}
		</div>

		<div class="flex-1 overflow-y-auto p-6" class:hidden={currentTab !== 'timbre'}>
			{#if visited.timbre}
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
