<script lang="ts">
	import ParameterControl from '$lib/components/generation/ParameterControl.svelte';
	import FrequencySelector from '$lib/components/generation/FrequencySelector.svelte';
	import { fluteParams, viewMode, DEFAULT_PARAMETERS } from '$lib/stores/fluteStore';
	import {
		validateBoreDiameter,
		validateWallThickness
	} from '$lib/components/generation/designParametersValidation';
	import { PARAMETER_INFO } from '$lib/components/generation/designParametersInfo';
	import { getDefaultCorkDistance, getDefaultCorkThickness } from '$lib/components/generation/designParamtersDefault';

	function handleParameterChange<K extends keyof typeof $fluteParams>(
		key: K,
		value: (typeof $fluteParams)[K] | number | boolean
	) {
		fluteParams.updateParameter(key, value as (typeof $fluteParams)[K]);
	}

	export let onNext: () => void;

	$: defaultCorkDistance = getDefaultCorkDistance($fluteParams);
	$: defaultCorkThickness = getDefaultCorkThickness($fluteParams);
</script>

<div class="space-y-6">
	<!-- Physical Parameters -->
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
			value={$fluteParams.corkDistance ? $fluteParams.corkDistance : defaultCorkDistance}
			min={5}
			max={30}
			step={0.5}
			unit="mm"
			inputType="number"
			visibility="advanced"
			getDefault={() => defaultCorkDistance}
			onChange={(v) => handleParameterChange('corkDistance', v)}
			info={PARAMETER_INFO.corkDistance}
		/>
		<ParameterControl
			label="Cork Thickness"
			value={$fluteParams.corkThickness ? $fluteParams.corkThickness : defaultCorkThickness}
			min={1}
			max={5}
			step={0.1}
			unit="mm"
			inputType="number"
			visibility="advanced"
			getDefault={() => defaultCorkThickness}
			onChange={(v) => handleParameterChange('corkThickness', v)}
			info={PARAMETER_INFO.corkThickness}
		/>
	</div>

	<!-- Embouchure Hole Parameters -->
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
			class="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
		>
			Next Step
			<i class="bi bi-arrow-right"></i>
		</button>
		<button
			on:click={() => fluteParams.resetAll()}
			class="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg transition-colors duration-200 border border-gray-700"
		>
			Reset All Parameters
		</button>
	</div>
</div>
