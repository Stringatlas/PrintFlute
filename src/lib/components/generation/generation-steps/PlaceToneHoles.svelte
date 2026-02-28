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
		<h3 class="heading-section">Tone Hole Placement</h3>
		
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

	<div class="space-y-4">
		<h3 class="heading-section">Thumb Hole</h3>
		
		<ParameterControl
			label="Enable Thumb Hole"
			value={$fluteParams.hasThumbHole}
			inputType="checkbox"
			visibility="always"
			getDefault={() => DEFAULT_PARAMETERS.hasThumbHole}
			onChange={(v) => handleParameterChange('hasThumbHole', v)}
			info={PARAMETER_INFO.hasThumbHole}
		/>

		{#if $fluteParams.hasThumbHole}
			<ParameterControl
				label="Thumb Hole Diameter"
				value={$fluteParams.thumbHoleDiameter}
				min={3}
				max={12}
				step={0.5}
				unit="mm"
				inputType="number"
				visibility="always"
				getDefault={() => DEFAULT_PARAMETERS.thumbHoleDiameter}
				onChange={(v) => handleParameterChange('thumbHoleDiameter', v)}
				info={PARAMETER_INFO.thumbHoleDiameter}
			/>

			<ParameterControl
				label="Thumb Hole Angle"
				value={$fluteParams.thumbHoleAngle}
				min={0}
				max={90}
				step={5}
				unit="deg"
				inputType="slider"
				visibility="always"
				getDefault={() => DEFAULT_PARAMETERS.thumbHoleAngle}
				onChange={(v) => handleParameterChange('thumbHoleAngle', v)}
				info={PARAMETER_INFO.thumbHoleAngle}
			/>
		{/if}
	</div>

	<div class="step-nav">
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