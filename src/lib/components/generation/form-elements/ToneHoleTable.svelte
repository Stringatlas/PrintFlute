<script lang="ts">
	import { viewMode, toneHoleParams } from '$lib/stores/fluteStore';
	import { DIATONIC_SCALE_CENTS } from '$lib/audio/musicTheory';
    import { validateDiameter } from '$lib/components/generation/designParametersValidation';
	import Tooltip from './Tooltip.svelte';

	export let numberOfHoles: number;

	interface ColumnInfo {
		key: string;
		label: string;
		info: string;
		visibility: 'always' | 'advanced';
	}

	const columns: ColumnInfo[] = [
		{
			key: 'number',
			label: 'Hole',
			info: 'Hole number counting from the first tone hole (closest to embouchure)',
			visibility: 'always'
		},
		{
			key: 'diameter',
			label: 'Diameter (mm)',
			info: 'The diameter of the tone hole. Larger holes produce louder sound and affect tuning',
			visibility: 'always'
		},
		{
			key: 'pitch',
			label: 'Pitch (cents)',
			info: 'Number of cents above the fundamental frequency when this hole is open (diatonic scale)',
			visibility: 'advanced'
		},
		{
			key: 'distance',
			label: 'Distance (mm)',
			info: 'Distance from the base of the flute to the center of this tone hole',
			visibility: 'always'
		},
		{
			key: 'cutoff',
			label: 'Cutoff Ratio',
			info: 'Ratio of cutoff frequency to the note frequency. Affects tone quality and response',
			visibility: 'advanced'
		}
	];

	function handleDiameterInput(index: number, event: Event) {
		const target = event.target as HTMLInputElement;
		const value = parseFloat(target.value);
		if (!isNaN(value)) {
			toneHoleParams.updateHoleDiameter(index, value);
		}
	}

	function handleCentsInput(index: number, event: Event) {
		const target = event.target as HTMLInputElement;
		const value = parseFloat(target.value);
		if (!isNaN(value)) {
			toneHoleParams.updateHoleCents(index, value);
		}
	}

	function placeholderCalculateDistances(numHoles: number): number[] {
		const distances: number[] = [];
		const baseDistance = 50;
		const spacing = 25;
		for (let i = 0; i < numHoles; i++) {
			distances[i] = baseDistance + (i * spacing);
		}
		return distances;
	}

	function placeholderCalculateCutoffRatios(numHoles: number): number[] {
		return Array(numHoles).fill(1.5);
	}

	$: visibleColumns = columns.filter(col => 
		col.visibility === 'always' || $viewMode === 'advanced'
	);

	$: {
		const calculatedDistances = placeholderCalculateDistances(numberOfHoles);
		calculatedDistances.forEach((dist, i) => {
			toneHoleParams.updateHoleDistance(i, dist);
		});

		const calculatedRatios = placeholderCalculateCutoffRatios(numberOfHoles);
		calculatedRatios.forEach((ratio, i) => {
			toneHoleParams.updateCutoffRatio(i, ratio);
		});

		for (let i = 0; i < numberOfHoles; i++) {
			if (i < DIATONIC_SCALE_CENTS.length) {
				toneHoleParams.updateHoleCents(i, DIATONIC_SCALE_CENTS[i]);
			}
		}
	}

	let validationResults: Record<number, { status: 'success' | 'warning' | 'error'; message?: string }> = {};

	$: {
		validationResults = {};
		for (let i = 0; i < numberOfHoles; i++) {
			validationResults[i] = validateDiameter($toneHoleParams.holeDiameters[i] || 8);
		}
	}
</script>

<div class="overflow-x-auto">
	<table class="w-full text-sm">
		<thead>
			<tr class="border-b border-gray-700">
				{#each visibleColumns as column}
					<th class="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
						<div class="flex items-center gap-2">
							<span>{column.label}</span>
							<Tooltip text={column.info} type="info" />
						</div>
					</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each Array(numberOfHoles) as _, index}
				<tr class="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
					{#each visibleColumns as column}
						<td class="px-3 py-2">
							{#if column.key === 'number'}
								<span class="text-gray-300">{index + 1}</span>
							{:else if column.key === 'diameter'}
								<div class="flex items-center gap-2">
									<input
										type="number"
										value={$toneHoleParams.holeDiameters[index] || 8}
										min={3}
										max={15}
										step={0.5}
										on:input={(e) => handleDiameterInput(index, e)}
										class="w-20 px-2 py-1 bg-gray-800 border {validationResults[index]?.status === 'error' 
											? 'border-red-500' 
											: validationResults[index]?.status === 'warning' 
											? 'border-yellow-500' 
											: 'border-gray-700'} rounded text-gray-200 focus:outline-none focus:border-primary-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
									/>
									{#if validationResults[index]?.status !== 'success'}
										<Tooltip text={validationResults[index]?.message || ''} type={validationResults[index]?.status} />
									{/if}
								</div>
							{:else if column.key === 'pitch'}
								<input
									type="number"
									value={$toneHoleParams.holeCents[index] || 0}
									min={0}
									max={2400}
									step={1}
									on:input={(e) => handleCentsInput(index, e)}
									class="w-20 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-gray-200 focus:outline-none focus:border-primary-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
								/>
							{:else if column.key === 'distance'}
								<span class="text-gray-300">{($toneHoleParams.holeDistances[index] || 0).toFixed(1)}</span>
							{:else if column.key === 'cutoff'}
								<span class="text-gray-300">{($toneHoleParams.cutoffRatios[index] || 0).toFixed(2)}</span>
							{/if}
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
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
