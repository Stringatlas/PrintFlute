<script lang="ts">
	import MainGeometry from '$lib/components/generation/generation-steps/MainGeometry.svelte';
	import ProcessForPrinting from '$lib/components/generation/generation-steps/ProcessForPrinting.svelte';
	import PlacetoneHoles from '$lib/components/generation/generation-steps/PlaceToneHoles.svelte';
	import Tooltip from '$lib/components/generation/form-elements/Tooltip.svelte';
    import { viewMode, fluteParams, toneHoleParams, currentDesignStep } from '$lib/stores/fluteStore';
	import { resolveComputedParameter } from '$lib/components/generation/generation-steps/designParametersDefault';
    
	let currentStep = 1;

	const steps = [
		{ number: 1, label: 'Main Geometry', icon: 'bi-1-circle-fill' },
        { number: 2, label: 'Place Tone Holes', icon: 'bi-2-circle-fill' },
		{ number: 3, label: 'Process for Printing', icon: 'bi-3-circle-fill' }
	];

    const totalSteps = steps.length;

	function toggleViewMode() {
		viewMode.update(mode => (mode === 'basic' ? 'advanced' : 'basic'));
	}

	function goToStep(step: number) {
		currentStep = step;
		currentDesignStep.set(step as 1 | 2 | 3);
	}

	$: progressPercent = ((currentStep - 1) / (totalSteps - 1)) * 100;
	
	$: fluteParamsText = (() => {
		const holeInfo = Array.from({ length: $fluteParams.numberOfToneHoles }, (_, i) => {
			const diameter = $toneHoleParams.holeDiameters[i] || 0;
			const distance = $toneHoleParams.holeDistances[i] || 0;
			return `  Hole ${i + 1}: ${diameter}mm @ ${distance.toFixed(1)}mm`;
		}).join('\n');
		
		const corkDistance = resolveComputedParameter('corkDistance', $fluteParams);
		const corkThickness = resolveComputedParameter('corkThickness', $fluteParams);
		
		return `Bore: ${$fluteParams.boreDiameter}mm
Wall: ${$fluteParams.wallThickness}mm
Cork Distance: ${corkDistance.toFixed(1)}mm
Cork Thickness: ${corkThickness.toFixed(1)}mm
Embouchure: ${$fluteParams.embouchureHoleLength}×${$fluteParams.embouchureHoleWidth}mm
Embouchure Distance: ${$fluteParams.embouchureDistance.toFixed(1)}mm
Fundamental: ${$fluteParams.fundamentalFrequency.toFixed(2)}Hz
Holes: ${$fluteParams.numberOfToneHoles}
Flute Length: ${$fluteParams.fluteLength.toFixed(1)}mm
${holeInfo}`;
	})();
</script>

<div class="space-y-6 p-4 sm:p-6 md:p-8">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-2">
			<h2 class="text-xl font-semibold text-primary-400">Flute Designer</h2>
			<Tooltip text={fluteParamsText} type="info" />
		</div>
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
		<!-- Step Indicators -->
		<div class="relative flex justify-between">
			<!-- Progress Lines (behind icons) -->
			<div class="absolute left-0 right-0 top-4 -translate-y-1/2 px-12 pointer-events-none">
				<div class="relative h-0.5 bg-gray-700">
					<div 
						class="absolute h-full bg-primary-500 transition-all duration-300"
						style="width: {progressPercent}%;"
					></div>
				</div>
			</div>

			{#each steps as step}
				<button
					on:click={() => goToStep(step.number)}
					class="flex flex-col items-center gap-2 group"
				>
					<div class="relative flex items-center justify-center h-8">
						<div class="absolute w-10 h-10 bg-gray-900 rounded-full z-5"></div>
						
						<i 
							class="relative z-10 {step.icon} text-3xl transition-colors duration-200 {
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
			<PlacetoneHoles onBack={() => goToStep(1)} onNext={() => goToStep(3)} />
        {:else if currentStep === 3}
			<ProcessForPrinting onBack={() => goToStep(2)} />
		{/if}
	</div>
</div>
