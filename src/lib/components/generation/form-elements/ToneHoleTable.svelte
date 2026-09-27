<script lang="ts">
	import { resolvedDesignSnapshot, toneHoleParams } from '$lib/stores/fluteStore';
    import { viewMode } from '$lib/stores/uiStore';
	import { calculationError } from '$lib/utils/fluteCalculationHelper';
	import { TONE_HOLE_COLUMNS, TONE_HOLE_FIELDS } from '$lib/domain/designSchema';
	import Tooltip from './Tooltip.svelte';

	export let numberOfHoles: number;

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

	function handleGeometryInput(
		key: 'distance' | 'angle',
		index: number,
		event: Event
	) {
		const value = parseFloat((event.target as HTMLInputElement).value);
		if (Number.isNaN(value)) return;
		if (key === 'distance') toneHoleParams.updateHoleDistance(index, value);
		else toneHoleParams.updateHoleAngle(index, value);
	}

	function useRecommendedPosition(index: number) {
		const advisory = tuningByIndex.get(index);
		if (advisory) toneHoleParams.updateHoleDistance(index, advisory.suggestedPosition);
	}

	function fitDiameterToPosition(index: number) {
		const diameter = tuningByIndex.get(index)?.suggestedDiameter;
		if (diameter !== undefined) toneHoleParams.updateHoleDiameter(index, diameter);
	}

	let showTuningGuidance = true;
	$: tuningByIndex = new Map(
		($resolvedDesignSnapshot?.tuning.toneHoles ?? []).map((advisory) => [advisory.index, advisory])
	);

	$: visibleColumns = TONE_HOLE_COLUMNS.filter(col =>
		col.visibility === 'always' || $viewMode === 'advanced'
	);

	let validationResults: Record<number, { status: 'success' | 'warning' | 'error'; message?: string }> = {};

	$: {
		validationResults = {};
		for (let i = 0; i < numberOfHoles; i++) {
			validationResults[i] = TONE_HOLE_FIELDS.holeDiameters.validate?.(
				$toneHoleParams.holeDiameters[i] ?? 8
			) ?? { status: 'success' };
		}
	}
</script>

<div class="mb-3 flex items-center justify-between gap-4">
	<div>
		<div class="text-sm font-medium text-gray-200">Tuning guidance</div>
		<div class="text-xs text-gray-400">Optional advice only; your geometry is never changed automatically.</div>
	</div>
	<label class="flex items-center gap-2 text-sm text-gray-300">
		<input type="checkbox" bind:checked={showTuningGuidance} />
		Show
	</label>
</div>

{#if showTuningGuidance && $resolvedDesignSnapshot?.tuning.available === false}
	<div class="mb-3 rounded border border-yellow-700/60 bg-yellow-950/30 px-3 py-2 text-xs text-yellow-300">
		{$resolvedDesignSnapshot.tuning.message}
	</div>
{/if}

{#if $calculationError}
	<div class="alert-error mb-4">
		<div class="flex items-start gap-3">
			<svg class="w-5 h-5 text-red-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>
			<div>
				<h4 class="font-semibold text-red-400 mb-1">Calculation Error</h4>
				<p class="text-sm text-red-300">{$calculationError}</p>
			</div>
		</div>
	</div>
{/if}

<div class="overflow-x-auto">
	<table class="table">
		<thead>
			<tr class="table-header">
				{#each visibleColumns as column}
					<th class="table-header-cell">
						<div class="flex items-center gap-2">
							<span>{column.label}{column.unit ? ` (${column.unit})` : ''}</span>
							<div class="font-normal">
								<Tooltip text={column.tooltip} type="info" />
							</div>
						</div>
					</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each Array(numberOfHoles) as _, index}
				<tr class="table-row">
					{#each visibleColumns as column}
						<td class="table-cell">
							{#if column.key === 'number'}
								<span>{index + 1}</span>
							{:else if column.key === 'diameter'}
								<div class="flex items-center gap-2">
									<input
										type="number"
										value={$toneHoleParams.holeDiameters[index] ?? 8}
										min={TONE_HOLE_FIELDS.holeDiameters.bounds?.min}
										max={TONE_HOLE_FIELDS.holeDiameters.bounds?.max}
										step={TONE_HOLE_FIELDS.holeDiameters.step}
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
									value={$toneHoleParams.holeCents[index]}
									min={TONE_HOLE_FIELDS.holeCents.bounds?.min}
									max={TONE_HOLE_FIELDS.holeCents.bounds?.max}
									step={TONE_HOLE_FIELDS.holeCents.step}
									on:input={(e) => handleCentsInput(index, e)}
									class="w-20 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-gray-200 focus:outline-none focus:border-primary-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
								/>
							{:else if column.key === 'distance'}
								<input
									type="number"
									value={$toneHoleParams.holeDistances[index] ?? 0}
									min={TONE_HOLE_FIELDS.holeDistances.bounds?.min}
									max={TONE_HOLE_FIELDS.holeDistances.bounds?.max}
									step={TONE_HOLE_FIELDS.holeDistances.step}
									on:input={(e) => handleGeometryInput('distance', index, e)}
									class="w-20 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-gray-200 focus:outline-none focus:border-primary-500"
								/>
							{:else if column.key === 'angle'}
								<input
									type="number"
									value={$toneHoleParams.holeAngles[index] ?? 0}
									min={TONE_HOLE_FIELDS.holeAngles.bounds?.min}
									max={TONE_HOLE_FIELDS.holeAngles.bounds?.max}
									step={TONE_HOLE_FIELDS.holeAngles.step}
									on:input={(e) => handleGeometryInput('angle', index, e)}
									class="w-20 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-gray-200 focus:outline-none focus:border-primary-500"
								/>
							{:else if column.key === 'cutoff'}
								<span>{($toneHoleParams.cutoffRatios[index] || 0).toFixed(2)}</span>
							{/if}
						</td>
					{/each}
				</tr>
				{#if showTuningGuidance && tuningByIndex.get(index)?.status !== 'in-tune'}
					<tr class="border-b border-gray-800">
						<td colspan={visibleColumns.length} class="px-3 pb-2 text-xs text-yellow-300">
							<div class="flex flex-wrap items-center justify-between gap-2">
								<span>{tuningByIndex.get(index)?.message}</span>
								<div class="flex shrink-0 gap-1.5">
									<button
										type="button"
										on:click={() => useRecommendedPosition(index)}
										class="rounded border border-yellow-600/70 px-2 py-1 text-[11px] font-medium text-yellow-200 hover:bg-yellow-900/50"
									>
										Use position
									</button>
									<button
										type="button"
										on:click={() => fitDiameterToPosition(index)}
										disabled={tuningByIndex.get(index)?.suggestedDiameter === undefined}
										title={tuningByIndex.get(index)?.suggestedDiameter === undefined
											? 'No diameter in the supported acoustic range can match this position'
											: 'Micro-adjust diameter to preserve the position you set'}
										class="rounded border border-yellow-600/70 px-2 py-1 text-[11px] font-medium text-yellow-200 hover:bg-yellow-900/50 disabled:cursor-not-allowed disabled:opacity-40"
									>
										Fit size
									</button>
								</div>
							</div>
						</td>
					</tr>
				{/if}
			{/each}
		</tbody>
	</table>
</div>
