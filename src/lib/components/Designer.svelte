<script lang="ts">
	import MainGeometry from './generation/MainGeometry.svelte';
	import ProcessForPrinting from './generation/ProcessForPrinting.svelte';
	import { viewMode } from '$lib/stores/fluteStore';

	let currentStep = 1;
	const totalSteps = 2;

	const steps = [
		{ number: 1, label: 'Main Geometry', icon: 'bi-1-circle-fill' },
		{ number: 2, label: 'Process for Printing', icon: 'bi-2-circle-fill' }
	];

	function toggleViewMode() {
		viewMode.update(mode => (mode === 'basic' ? 'advanced' : 'basic'));
	}

	function goToStep(step: number) {
		currentStep = step;
	}

	$: progressPercent = ((currentStep - 1) / (totalSteps - 1)) * 100;
</script>

<div class="space-y-6 p-4 sm:p-6 md:p-8">
	<!-- Header with View Mode Toggle -->
	<div class="flex items-center justify-between">
		<h2 class="text-xl font-semibold text-primary-400">Flute Parameters</h2>
		<div class="flex rounded-lg bg-gray-800 p-1 border border-gray-700">
			<button
				on:click={toggleViewMode}
				class="px-3 py-1 text-sm rounded transition-colors duration-200 {$viewMode === 'basic'
					? 'bg-primary-600 text-white'
					: 'text-gray-400 hover:text-gray-200'}"
			>
				Basic
			</button>
			<button
				on:click={toggleViewMode}
				class="px-3 py-1 text-sm rounded transition-colors duration-200 {$viewMode === 'advanced'
					? 'bg-primary-600 text-white'
					: 'text-gray-400 hover:text-gray-200'}"
			>
				Advanced
			</button>
		</div>
	</div>

	<!-- Step Progress Bar -->
	<div class="relative py-6">
		<!-- Progress Line -->
		<div class="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-700 -translate-y-1/2" style="margin: 0 60px;"></div>
		<div 
			class="absolute top-1/2 left-0 h-0.5 bg-primary-500 -translate-y-1/2 transition-all duration-300" 
			style="margin-left: 60px; width: calc((100% - 120px) * {progressPercent} / 100);"
		></div>

		<!-- Step Indicators -->
		<div class="relative flex justify-between">
			{#each steps as step}
				<button
					on:click={() => goToStep(step.number)}
					class="flex flex-col items-center gap-2 group"
				>
					<div class="relative flex items-center justify-center">
						<i 
							class="{step.icon} text-3xl transition-colors duration-200 {
								currentStep >= step.number 
									? 'text-primary-500' 
									: 'text-gray-600'
							} {currentStep === step.number ? 'scale-110' : ''} group-hover:scale-110"
						></i>
					</div>
					<span class="text-xs font-medium transition-colors duration-200 {
						currentStep === step.number 
							? 'text-primary-400' 
							: 'text-gray-500'
					}">
						{step.label}
					</span>
				</button>
			{/each}
		</div>
	</div>

	<!-- Step Content -->
	<div class="mt-6">
		{#if currentStep === 1}
			<MainGeometry onNext={() => goToStep(2)} />
		{:else if currentStep === 2}
			<ProcessForPrinting onBack={() => goToStep(1)} />
		{/if}
	</div>
</div>
