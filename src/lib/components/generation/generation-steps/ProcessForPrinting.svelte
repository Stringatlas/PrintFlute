<script lang="ts">
	import { onMount } from 'svelte';
	import ParameterControl from '$lib/components/generation/form-elements/ParameterControl.svelte';
	import { fluteParams, DEFAULT_PARAMETERS, toneHoleParams } from '$lib/stores/fluteStore';
	import { PARAMETER_INFO } from '$lib/components/generation/generation-steps/designParametersInfo';
	import { validateCutDistance } from '$lib/components/generation/generation-steps/designParametersValidation';
	import { DIATONIC_SCALE_CENTS } from '$lib/audio/musicTheory';
	import { calculatedFluteData, updateCalculatedValues } from '$lib/utils/fluteCalculationHelper';

	function handleParameterChange<K extends keyof typeof $fluteParams>(
		key: K,
		value: (typeof $fluteParams)[K] | number | boolean
	) {
		fluteParams.updateParameter(key, value as (typeof $fluteParams)[K]);
	}

	function updateCutDistance(index: number, value: number | boolean) {
		const newDistances = [...$fluteParams.cutDistances];
		newDistances[index] = value as number;
		fluteParams.updateParameter('cutDistances', newDistances);
	}

	export let onBack: () => void;

	onMount(() => {
		// Ensure tone holes have default cents values if not set
		for (let i = 0; i < $fluteParams.numberOfToneHoles; i++) {
			if ($toneHoleParams.holeCents[i] === undefined || $toneHoleParams.holeCents[i] === 0) {
				if (i + 1 < DIATONIC_SCALE_CENTS.length) {
					toneHoleParams.updateHoleCents(i, DIATONIC_SCALE_CENTS[i + 1]);
				}
			}
		}
		
		// Trigger calculation if not already done
		if ($calculatedFluteData) {
			updateCalculatedValues($calculatedFluteData, $fluteParams.numberOfToneHoles);
		}
	});

	// Update cutDistances array when numberOfCuts changes
	$: {
		const currentLength = $fluteParams.cutDistances.length;
		const targetLength = $fluteParams.numberOfCuts;
		
		if (currentLength !== targetLength) {
			const newDistances = Array.from({ length: targetLength }, (_, i) => 
				i < currentLength ? $fluteParams.cutDistances[i] : 0
			);
			fluteParams.updateParameter('cutDistances', newDistances);
		}
	}
	
	// Recalculate when parameters change
	$: if ($calculatedFluteData) {
		updateCalculatedValues($calculatedFluteData, $fluteParams.numberOfToneHoles);
	}
</script>

<div class="space-y-6">
	<!-- Printing Parameters -->
	<div class="space-y-4">
		<h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wide">Printing Parameters</h3>
		<ParameterControl
			label="Tone Hole Fillet Radius"
			value={$fluteParams.toneHoleFilletRadius}
			min={0}
			max={3}
			step={0.1}
			unit="mm"
			inputType="number"
			visibility="always"
			getDefault={() => DEFAULT_PARAMETERS.toneHoleFilletRadius}
			onChange={(v) => handleParameterChange('toneHoleFilletRadius', v)}
			info={PARAMETER_INFO.toneHoleFilletRadius}
		/>
	</div>

	<!-- Cut Configuration -->
	<div class="space-y-4 mt-8">
		<h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wide">Cut Configuration</h3>
		<ParameterControl
			label="Connector Length"
			value={$fluteParams.connectorLength}
			min={5}
			max={30}
			step={1}
			unit="mm"
			inputType="number"
			visibility="always"
			getDefault={() => DEFAULT_PARAMETERS.connectorLength}
			onChange={(v) => handleParameterChange('connectorLength', v)}
			info={PARAMETER_INFO.connectorLength}
		/>
        
        <ParameterControl
			label="Number of Cuts"
			value={$fluteParams.numberOfCuts}
			min={0}
			max={5}
			unit=" cuts"
			inputType="slider"
			visibility="always"
			getDefault={() => DEFAULT_PARAMETERS.numberOfCuts}
			onChange={(v) => handleParameterChange('numberOfCuts', v)}
			info={PARAMETER_INFO.numberOfCuts}
		/>
		
		{#each Array(($fluteParams.numberOfCuts)) as _, i}
			<ParameterControl
				label="Cut {i + 1} Distance"
				value={$fluteParams.cutDistances[i] ?? 0}
				min={0}
				max={500}
				step={1}
				unit="mm"
				inputType="number"
				visibility="always"
				getDefault={() => 0}
				onChange={(v) => updateCutDistance(i, v)}
				info={PARAMETER_INFO.cutDistance}
				validate={(v) => validateCutDistance(
					v as number,
					i,
					$fluteParams.cutDistances,
					$fluteParams.connectorLength,
					$fluteParams.embouchureDistance,
					$fluteParams.embouchureHoleLength,
					$fluteParams.fluteLength
				)}
			/>
		{/each}
	</div>

	<div class="space-y-2 mt-8">
		<button class="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors duration-200 flex items-center justify-center gap-2">
			Export
			<i class="bi bi-download"></i>
		</button>
		<button
			on:click={onBack}
			class="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg transition-colors duration-200 border border-gray-700 flex items-center justify-center gap-2"
		>
			<i class="bi bi-arrow-left"></i>
			Back
		</button>
	</div>
</div>
