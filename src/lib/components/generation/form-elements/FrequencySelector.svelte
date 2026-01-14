<script lang="ts">
	import { COMMON_FREQUENCIES } from '$lib/constants/tuning';

	export let value: number;
	export let getDefault: () => number;
	export let onChange: (value: number) => void;

	const selectId = 'frequency-selector';
	let customValue = 440;
	let isCustom = false;
	let selectedFreq = 'custom';

	function updateSelectionState(freq: number) {
		const matchingFreq = COMMON_FREQUENCIES.find(f => Math.abs(f.frequency - freq) < 0.01);
		if (matchingFreq) {
			selectedFreq = matchingFreq.frequency.toString();
			isCustom = false;
		} else {
			selectedFreq = 'custom';
			isCustom = true;
			customValue = freq;
		}
	}

	$: updateSelectionState(value);

	function handleSelectChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		const selected = target.value;
		
		if (selected === 'custom') {
			isCustom = true;
			customValue = value;
		} else {
			isCustom = false;
			const freq = parseFloat(selected);
			onChange(freq);
		}
	}

	function handleCustomInput(event: Event) {
		const target = event.target as HTMLInputElement;
		const freq = parseFloat(target.value);
		if (!isNaN(freq)) {
			customValue = freq;
			onChange(freq);
		}
	}

	function resetToDefault() {
		const defaultValue = getDefault();
		onChange(defaultValue);
	}

	$: isDefault = value === getDefault();
</script>

<div class="flex flex-col gap-2">
	<div class="flex items-center justify-between">
		<label for={selectId} class="block text-sm font-medium text-gray-300">Fundamental Frequency</label>
		<button
			on:click={resetToDefault}
			disabled={isDefault}
			class="text-xs px-2 py-0.5 rounded transition-colors duration-200 {isDefault
				? 'text-gray-600 cursor-not-allowed'
				: 'text-primary-400 hover:text-primary-300 hover:bg-gray-800'}"
			title="Reset to default"
		>
			Reset
		</button>
	</div>
	<div class="flex items-center gap-2">
		<select
			id={selectId}
			bind:value={selectedFreq}
			on:change={handleSelectChange}
			class="w-32 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-primary-500"
		>
			<option value="custom">Custom</option>
			{#each COMMON_FREQUENCIES as freq}
			<option value={freq.frequency.toString()}>
					{freq.note}{freq.octave}
				</option>
			{/each}
		</select>
		{#if isCustom}
			<input
				type="number"
				min={220}
				max={880}
				step={0.1}
				value={customValue}
				on:input={handleCustomInput}
				class="w-32 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-primary-500"
			/>
		{/if}
		<span class="text-sm text-gray-400 min-w-15">{value.toFixed(2)} Hz</span>
	</div>
</div>

<style>
	input[type='number'] {
		-moz-appearance: textfield;
        appearance: textfield;
	}
	input[type='number']::-webkit-outer-spin-button,
	input[type='number']::-webkit-inner-spin-button {
		-webkit-appearance: none;
		appearance: none;
		margin: 0;
	}
</style>
