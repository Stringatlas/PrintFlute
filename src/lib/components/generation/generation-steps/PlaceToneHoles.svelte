<script lang="ts">
	import ParameterControl from '$lib/components/generation/form-elements/ParameterControl.svelte';
	import ToneHoleTable from '$lib/components/generation/form-elements/ToneHoleTable.svelte';
	import { fluteParams, DEFAULT_PARAMETERS } from '$lib/stores/fluteStore';
	import { PARAMETER_INFO } from '$lib/components/generation/generation-steps/designParametersInfo';

	function handleParameterChange<K extends keyof typeof $fluteParams>(
		key: K,
		value: (typeof $fluteParams)[K] | number | boolean
	) {
		fluteParams.updateParameter(key, value as (typeof $fluteParams)[K]);
	}
    
	export let onBack: () => void;
	export let onNext: () => void;
</script>

<div class="space-y-6">
	<div class="space-y-4">
		<h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wide">Tone Hole Placement</h3>
		
		<ParameterControl
			label="Number of Tone Holes"
			value={$fluteParams.numberOfToneHoles}
			min={3}
			max={8}
			unit=" holes"
			inputType="slider"
			visibility="always"
			getDefault={() => DEFAULT_PARAMETERS.numberOfToneHoles}
			onChange={(v) => handleParameterChange('numberOfToneHoles', v)}
			info={PARAMETER_INFO.numberOfToneHoles}
		/>
	</div>

	<div class="mt-6">
		<ToneHoleTable numberOfHoles={$fluteParams.numberOfToneHoles} />
	</div>

	<div class="space-y-2 mt-8">
		<button
			on:click={onNext}
			class="w-full btn-primary"
		>
			Next Step
			<i class="bi bi-arrow-right"></i>
		</button>
		<button
			on:click={onBack}
			class="w-full btn-secondary"
		>
			<i class="bi bi-arrow-left"></i>
			Back
		</button>
	</div>
</div>