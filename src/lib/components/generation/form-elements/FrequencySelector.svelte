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
		<label for={selectId} class="label">Fundamental Frequency</label>
		<button
			on:click={resetToDefault}
			disabled={isDefault}
			class="btn-reset"
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
			class="input-select w-32"
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
				class="input-number"
			/>
		{/if}
		<span class="text-muted min-w-15">{value.toFixed(2)} Hz</span>
	</div>
</div>

