<script lang="ts">
	import MainGeometry from '$lib/components/generation/generation-steps/MainGeometry.svelte';
	import ProcessForPrinting from '$lib/components/generation/generation-steps/ProcessForPrinting.svelte';
	import PlaceToneHoles from '$lib/components/generation/generation-steps/PlaceToneHoles.svelte';
	import Tooltip from '$lib/components/generation/form-elements/Tooltip.svelte';
    import { fluteParams, toneHoleParams } from '$lib/stores/fluteStore';
    import { viewMode, currentDesignStep } from '$lib/stores/uiStore';
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
		
		return [
			`Bore: ${$fluteParams.boreDiameter}mm`,
			`Wall: ${$fluteParams.wallThickness}mm`,
			`Cork Distance: ${corkDistance.toFixed(1)}mm`,
			`Cork Thickness: ${corkThickness.toFixed(1)}mm`,
			`Embouchure: ${$fluteParams.embouchureHoleLength}x${$fluteParams.embouchureHoleWidth}mm`,
			`Embouchure Distance: ${$fluteParams.embouchureDistance.toFixed(1)}mm`,
			`Fundamental: ${$fluteParams.fundamentalFrequency.toFixed(2)}Hz`,
			`Holes: ${$fluteParams.numberOfToneHoles}`,
			`Flute Length: ${$fluteParams.fluteLength.toFixed(1)}mm`,
			holeInfo
		].join('\n');
	})();
</script>

<div class="page-container">
	<div class="flex-between">
		<div class="flex-center">
			<h2 class="heading-page">Flute Designer</h2>
			<Tooltip text={fluteParamsText} type="info" />
		</div>
		<div class="toggle-group">
			<button
				on:click={toggleViewMode}
				class={$viewMode === 'basic' ? 'toggle-btn-active' : 'toggle-btn'}
			>
				Basic
			</button>
			<button
				on:click={toggleViewMode}
				class={$viewMode === 'advanced' ? 'toggle-btn-active' : 'toggle-btn'}
			>
				Advanced
			</button>
		</div>
	</div>

	<div class="step-progress">
		<div class="relative flex justify-between">
			<div class="step-progress-track">
				<div class="step-progress-track-bg">
					<div 
						class="step-progress-track-fill"
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
			<PlaceToneHoles onBack={() => goToStep(1)} onNext={() => goToStep(3)} />
        {:else if currentStep === 3}
			<ProcessForPrinting onBack={() => goToStep(2)} />
		{/if}
	</div>
</div>
