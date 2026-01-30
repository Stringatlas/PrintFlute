<script lang="ts">
	import ParameterControl from '$lib/components/generation/form-elements/ParameterControl.svelte';
	import FrequencySelector from '$lib/components/generation/form-elements/FrequencySelector.svelte';
	import { fluteParams, DEFAULT_PARAMETERS } from '$lib/stores/fluteStore';
    import { viewMode } from '$lib/stores/uiStore';
	import {
		validateBoreDiameter,
		validateWallThickness
	} from '$lib/components/generation/generation-steps/designParametersValidation';
	import { PARAMETER_INFO } from '$lib/components/generation/generation-steps/designParametersInfo';
	import { 
		getDefaultCorkDistance, 
		getDefaultCorkThickness,
		resolveComputedParameter 
	} from '$lib/components/generation/generation-steps/designParametersDefault';

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
		<h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wide">Physical Parameters</h3>
		<ParameterControl
			label="Bore Diameter"
			value={$fluteParams.boreDiameter}
			min={10}
			max={30}
			step={0.5}
			unit="mm"
			inputType="number"
			visibility="always"
			validate={validateBoreDiameter}
			getDefault={() => DEFAULT_PARAMETERS.boreDiameter}
			onChange={(v) => handleParameterChange('boreDiameter', v)}
			info={PARAMETER_INFO.boreDiameter}
		/>
		<ParameterControl
			label="Wall Thickness"
			value={$fluteParams.wallThickness}
			min={1}
			max={5}
			step={0.1}
			unit="mm"
			inputType="number"
			visibility="always"
			validate={validateWallThickness}
			getDefault={() => DEFAULT_PARAMETERS.wallThickness}
			onChange={(v) => handleParameterChange('wallThickness', v)}
			info={PARAMETER_INFO.wallThickness}
		/>
		<ParameterControl
			label="Thumb Hole"
			value={$fluteParams.hasThumbHole}
			inputType="checkbox"
			visibility="always"
			getDefault={() => DEFAULT_PARAMETERS.hasThumbHole}
			onChange={(v) => handleParameterChange('hasThumbHole', v)}
			info={PARAMETER_INFO.hasThumbHole}
		/>
		<ParameterControl
			label="Overhang Length"
			value={$fluteParams.overhangLength}
			min={0}
			max={50}
			step={1}
			unit="mm"
			inputType="number"
			visibility="advanced"
			getDefault={() => DEFAULT_PARAMETERS.overhangLength}
			onChange={(v) => handleParameterChange('overhangLength', v)}
			info={PARAMETER_INFO.overhangLength}
		/>
		<ParameterControl
			label="Cork Distance"
			value={resolvedCorkDistance}
			min={5}
			max={30}
			step={0.5}
			unit="mm"
			inputType="number"
			visibility="advanced"
			isComputed={true}
			computedMode={$fluteParams.corkDistance.mode}
			getDefault={() => getDefaultCorkDistance($fluteParams)}
			onChange={(v) => handleComputedParameterChange('corkDistance', v as number)}
			onResetComputed={() => handleComputedParameterReset('corkDistance')}
			info={PARAMETER_INFO.corkDistance}
		/>
		<ParameterControl
			label="Cork Thickness"
			value={resolvedCorkThickness}
			min={1}
			max={5}
			step={0.1}
			unit="mm"
			inputType="number"
			visibility="advanced"
			isComputed={true}
			computedMode={$fluteParams.corkThickness.mode}
			getDefault={() => getDefaultCorkThickness($fluteParams)}
			onChange={(v) => handleComputedParameterChange('corkThickness', v as number)}
			onResetComputed={() => handleComputedParameterReset('corkThickness')}
			info={PARAMETER_INFO.corkThickness}
		/>
	</div>

	<div class="space-y-4 mt-8">
		<h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wide">Embouchure Hole Parameters</h3>
		<ParameterControl
			label="Hole Length"
			value={$fluteParams.embouchureHoleLength}
			min={5}
			max={20}
			step={0.5}
			unit="mm"
			inputType="number"
			visibility="always"
			getDefault={() => DEFAULT_PARAMETERS.embouchureHoleLength}
			onChange={(v) => handleParameterChange('embouchureHoleLength', v)}
			info={PARAMETER_INFO.embouchureHoleLength}
		/>
		<ParameterControl
			label="Hole Width"
			value={$fluteParams.embouchureHoleWidth}
			min={5}
			max={15}
			step={0.5}
			unit="mm"
			inputType="number"
			visibility="always"
			getDefault={() => DEFAULT_PARAMETERS.embouchureHoleWidth}
			onChange={(v) => handleParameterChange('embouchureHoleWidth', v)}
			info={PARAMETER_INFO.embouchureHoleWidth}
		/>
		<ParameterControl
			label="Lip Coverage"
			value={$fluteParams.lipCoveragePercent}
			min={0}
			max={100}
			step={1}
			unit="%"
			inputType="number"
			visibility="advanced"
			getDefault={() => DEFAULT_PARAMETERS.lipCoveragePercent}
			onChange={(v) => handleParameterChange('lipCoveragePercent', v)}
			info={PARAMETER_INFO.lipCoveragePercent}
		/>
	</div>

	<!-- Tuning Parameters -->
	<div class="space-y-4 mt-8">
		<h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wide">Tuning Parameters</h3>
		<FrequencySelector
			value={$fluteParams.fundamentalFrequency}
			getDefault={() => DEFAULT_PARAMETERS.fundamentalFrequency}
			onChange={(v) => handleParameterChange('fundamentalFrequency', v)}
		/>
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

	<!-- Navigation -->
	<div class="space-y-2 mt-8">
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
