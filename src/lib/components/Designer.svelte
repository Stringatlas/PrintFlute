<script lang="ts">
	import ParameterControl from './generation/ParameterControl.svelte';
	import FrequencySelector from './generation/FrequencySelector.svelte';
	import { fluteParams, viewMode, DEFAULT_PARAMETERS } from '$lib/stores/fluteStore';
	import { COMMON_FREQUENCIES } from '$lib/constants/tuning';
	import {
		validateLength,
		validateBoreDiameter,
		validateWallThickness
	} from './generation/designParametersValidation';

	function toggleViewMode() {
		viewMode.update(mode => (mode === 'basic' ? 'advanced' : 'basic'));
	}

	function handleParameterChange<K extends keyof typeof $fluteParams>(
		key: K,
		value: (typeof $fluteParams)[K]
	) {
		fluteParams.updateParameter(key, value);
	}
</script>

<div class="space-y-6 p-4 sm:p-6 md:p-8">
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

	<!-- Physical Parameters -->
	<div class="space-y-4">
		<h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wide">Physical Parameters</h3>
		<ParameterControl
			label="Length"
			value={$fluteParams.length}
			min={200}
			max={600}
			unit="mm"
			inputType="number"
			visibility="always"
			validate={validateLength}
			getDefault={() => DEFAULT_PARAMETERS.length}
			onChange={(v) => handleParameterChange('length', v)}
		/>
		<ParameterControl
			label="Bore Diameter"
			value={$fluteParams.boreDiameter}
			min={10}
			max={30}
			step={0.5}
			unit="mm"
			inputType="number"
			visibility="advanced"
			validate={validateBoreDiameter}
			getDefault={() => DEFAULT_PARAMETERS.boreDiameter}
			onChange={(v) => handleParameterChange('boreDiameter', v)}
		/>
		<ParameterControl
			label="Wall Thickness"
			value={$fluteParams.wallThickness}
			min={1}
			max={5}
			step={0.1}
			unit="mm"
			inputType="number"
			visibility="advanced"
			validate={validateWallThickness}
			getDefault={() => DEFAULT_PARAMETERS.wallThickness}
			onChange={(v) => handleParameterChange('wallThickness', v)}
		/>
	</div>

	<!-- Tuning Parameters -->
	<div class="space-y-4">
		<h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wide">Tuning Parameters</h3>
		<ParameterControl
			label="Number of Tone Holes"
			value={$fluteParams.numberOfHoles}
			min={3}
			max={8}
			unit="holes"
			inputType="slider"
			visibility="always"
			getDefault={() => DEFAULT_PARAMETERS.numberOfHoles}
			onChange={(v) => handleParameterChange('numberOfHoles', v)}
		/>
		<FrequencySelector
			value={$fluteParams.fundamentalFrequency}
			getDefault={() => DEFAULT_PARAMETERS.fundamentalFrequency}
			onChange={(v) => handleParameterChange('fundamentalFrequency', v)}
		/>
	</div>

	<div>
		<div class="space-y-2">
			<button
				class="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors duration-200"
			>
				Generate STL
			</button>
			<button
				on:click={() => fluteParams.resetAll()}
				class="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg transition-colors duration-200 border border-gray-700"
			>
				Reset All Parameters
			</button>
		</div>
	</div>
</div>
