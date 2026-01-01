<script lang="ts">
	import SideNav from '$lib/components/SideNav.svelte';
	import Preview3D from '$lib/components/generation/Preview3D.svelte';
	import Designer from '$lib/components/Designer.svelte';
	import AudioAnalysis from '$lib/components/AudioAnalysis.svelte';
	import TimbreAnalysis from '$lib/components/TimbreAnalysis.svelte';
    import type { Tab } from '$lib/components/SideNav.svelte';

	let currentTab: Tab = $state('designer');
</script>

<div class="flex h-screen bg-gray-950">
	<SideNav bind:currentTab />

	<main class="flex-1 flex overflow-hidden">
		<div class="flex-1 overflow-y-auto p-6">
			{#if currentTab === 'designer'}
				<Designer />
			{:else if currentTab === 'tuner'}
				<AudioAnalysis />
			{:else if currentTab === 'timbre'}
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
