<script lang="ts">
	import ParameterControl from '$lib/components/generation/form-elements/ParameterControl.svelte';
	import FrequencySelector from '$lib/components/generation/form-elements/FrequencySelector.svelte';
	import { fluteParams, DEFAULT_PARAMETERS } from '$lib/stores/fluteStore';
	import { FLUTE_FIELDS } from '$lib/domain/designSchema';
	import {
		getDefaultCorkDistance,
		getDefaultCorkThickness,
		resolveComputedParameter
	} from '$lib/domain/computedParameters';

	function handleParameterChange<K extends keyof typeof $fluteParams>(
		key: K,
		value: (typeof $fluteParams)[K] | number | boolean
	) {
		fluteParams.updateParameter(key, value as (typeof $fluteParams)[K]);
	}

	function handleComputedParameterChange(
		key: 'corkDistance' | 'corkThickness',
		value: number
	) {
		fluteParams.setComputedOverride(key, value);
	}

	function handleComputedParameterReset(
		key: 'corkDistance' | 'corkThickness'
	) {
		fluteParams.resetComputedToAuto(key);
	}

	export let onNext: () => void;

	$: resolvedCorkDistance = resolveComputedParameter('corkDistance', $fluteParams);
	$: resolvedCorkThickness = resolveComputedParameter('corkThickness', $fluteParams);
</script>

<div class="space-y-6">
	<div class="space-y-4">
		<h3 class="heading-section">Physical Parameters</h3>
		<ParameterControl
			field={FLUTE_FIELDS.boreDiameter}
			value={$fluteParams.boreDiameter}
			getDefault={() => DEFAULT_PARAMETERS.boreDiameter}
			onChange={(v) => handleParameterChange('boreDiameter', v)}
		/>
		<ParameterControl
			field={FLUTE_FIELDS.wallThickness}
			value={$fluteParams.wallThickness}
			getDefault={() => DEFAULT_PARAMETERS.wallThickness}
			onChange={(v) => handleParameterChange('wallThickness', v)}
		/>
		<ParameterControl
			field={FLUTE_FIELDS.hasThumbHole}
			value={$fluteParams.hasThumbHole}
			getDefault={() => DEFAULT_PARAMETERS.hasThumbHole}
			onChange={(v) => handleParameterChange('hasThumbHole', v)}
		/>
		<ParameterControl
			field={FLUTE_FIELDS.overhangLength}
			value={$fluteParams.overhangLength}
			getDefault={() => DEFAULT_PARAMETERS.overhangLength}
			onChange={(v) => handleParameterChange('overhangLength', v)}
		/>
		<ParameterControl
			field={FLUTE_FIELDS.corkDistance}
			value={resolvedCorkDistance}
			computedMode={$fluteParams.corkDistance.mode}
			getDefault={() => getDefaultCorkDistance($fluteParams)}
			onChange={(v) => handleComputedParameterChange('corkDistance', v as number)}
			onResetComputed={() => handleComputedParameterReset('corkDistance')}
		/>
		<ParameterControl
			field={FLUTE_FIELDS.corkThickness}
			value={resolvedCorkThickness}
			computedMode={$fluteParams.corkThickness.mode}
			getDefault={() => getDefaultCorkThickness($fluteParams)}
			onChange={(v) => handleComputedParameterChange('corkThickness', v as number)}
			onResetComputed={() => handleComputedParameterReset('corkThickness')}
		/>
	</div>

	<div class="space-y-4 mt-8">
		<h3 class="heading-section">Embouchure Hole Parameters</h3>
		<ParameterControl
			field={FLUTE_FIELDS.embouchureHoleLength}
			value={$fluteParams.embouchureHoleLength}
			getDefault={() => DEFAULT_PARAMETERS.embouchureHoleLength}
			onChange={(v) => handleParameterChange('embouchureHoleLength', v)}
		/>
		<ParameterControl
			field={FLUTE_FIELDS.embouchureHoleWidth}
			value={$fluteParams.embouchureHoleWidth}
			getDefault={() => DEFAULT_PARAMETERS.embouchureHoleWidth}
			onChange={(v) => handleParameterChange('embouchureHoleWidth', v)}
		/>
		<ParameterControl
			field={FLUTE_FIELDS.lipCoveragePercent}
			value={$fluteParams.lipCoveragePercent}
			getDefault={() => DEFAULT_PARAMETERS.lipCoveragePercent}
			onChange={(v) => handleParameterChange('lipCoveragePercent', v)}
		/>
	</div>

	<!-- Tuning Parameters -->
	<div class="space-y-4 mt-8">
		<h3 class="heading-section">Tuning Parameters</h3>
		<FrequencySelector
			value={$fluteParams.fundamentalFrequency}
			getDefault={() => DEFAULT_PARAMETERS.fundamentalFrequency}
			onChange={(v) => handleParameterChange('fundamentalFrequency', v)}
		/>
        <ParameterControl
			field={FLUTE_FIELDS.numberOfToneHoles}
			value={$fluteParams.numberOfToneHoles}
			getDefault={() => DEFAULT_PARAMETERS.numberOfToneHoles}
			onChange={(v) => handleParameterChange('numberOfToneHoles', v)}
		/>
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
			on:click={() => fluteParams.resetAll()}
			class="w-full btn-secondary"
		>
			Reset All Parameters
		</button>
	</div>
</div>
