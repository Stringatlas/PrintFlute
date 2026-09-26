<script lang="ts">
	import ParameterControl from '$lib/components/generation/form-elements/ParameterControl.svelte';
	import ToneHoleTable from '$lib/components/generation/form-elements/ToneHoleTable.svelte';
	import { fluteParams, DEFAULT_PARAMETERS } from '$lib/stores/fluteStore';
	import { FLUTE_FIELDS } from '$lib/domain/designSchema';

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
			field={FLUTE_FIELDS.numberOfToneHoles}
			value={$fluteParams.numberOfToneHoles}
			getDefault={() => DEFAULT_PARAMETERS.numberOfToneHoles}
			onChange={(v) => handleParameterChange('numberOfToneHoles', v)}
		/>
	</div>

	<div class="mt-6">
		<ToneHoleTable numberOfHoles={$fluteParams.numberOfToneHoles} />
	</div>

	<div class="space-y-4">
		<h3 class="heading-section">Thumb Hole</h3>
		
		<ParameterControl
			field={FLUTE_FIELDS.hasThumbHole}
			label="Enable Thumb Hole"
			value={$fluteParams.hasThumbHole}
			getDefault={() => DEFAULT_PARAMETERS.hasThumbHole}
			onChange={(v) => handleParameterChange('hasThumbHole', v)}
		/>

		{#if $fluteParams.hasThumbHole}
			<ParameterControl
				field={FLUTE_FIELDS.thumbHoleDiameter}
				value={$fluteParams.thumbHoleDiameter}
				getDefault={() => DEFAULT_PARAMETERS.thumbHoleDiameter}
				onChange={(v) => handleParameterChange('thumbHoleDiameter', v)}
			/>
			<ParameterControl
				field={FLUTE_FIELDS.thumbHoleAngle}
				value={$fluteParams.thumbHoleAngle}
				getDefault={() => DEFAULT_PARAMETERS.thumbHoleAngle}
				onChange={(v) => handleParameterChange('thumbHoleAngle', v)}
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