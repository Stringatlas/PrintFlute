<script lang="ts">
	import ParameterControl from '$lib/components/generation/form-elements/ParameterControl.svelte';
	import ExportModal from '$lib/components/generation/form-elements/ExportModal.svelte';
    import { fluteParams, DEFAULT_PARAMETERS, toneHoleParams } from '$lib/stores/fluteStore';
	import { FLUTE_FIELDS } from '$lib/domain/designSchema';

    // TODO: Create validation for fillet radius (must be less than half the smallest tone hole diameter or wall thickness)
    let exportModalOpen = false;
	let exportModalRef: ExportModal;

	function handleParameterChange<K extends keyof typeof $fluteParams>(
		key: K,
		value: (typeof $fluteParams)[K] | number | boolean
	) {
		fluteParams.updateParameter(key, value as (typeof $fluteParams)[K]);
	}

	function updateCutDistance(index: number, value: number | boolean) {
		const newDistances = [...$fluteParams.cutDistances];
		newDistances[index] = value as number;
		fluteParams.updateParameter('cutDistances', newDistances);
	}

    function handleExport() {
		exportModalOpen = true;
		exportModalRef?.startExport();
	}

	export let onBack: () => void;

	// Update cutDistances array when numberOfCuts changes
	$: {
		const currentLength = $fluteParams.cutDistances.length;
		const targetLength = $fluteParams.numberOfCuts;
		
		if (currentLength !== targetLength) {
			const newDistances = Array.from({ length: targetLength }, (_, i) => 
				i < currentLength ? $fluteParams.cutDistances[i] : 0
			);
			fluteParams.updateParameter('cutDistances', newDistances);
		}
	}
</script>

<div class="space-y-6">
	<!-- Printing Parameters -->
	<div class="space-y-4">
		<h3 class="heading-section">Printing Parameters</h3>
		<ParameterControl
			field={FLUTE_FIELDS.toneHoleFilletRadius}
			value={$fluteParams.toneHoleFilletRadius}
			getDefault={() => DEFAULT_PARAMETERS.toneHoleFilletRadius}
			onChange={(v) => handleParameterChange('toneHoleFilletRadius', v)}
		/>
	</div>

	<!-- Cut Configuration -->
	<div class="space-y-4 mt-8">
		<h3 class="heading-section">Cut Configuration</h3>
		<ParameterControl
			field={FLUTE_FIELDS.connectorLength}
			value={$fluteParams.connectorLength}
			getDefault={() => DEFAULT_PARAMETERS.connectorLength}
			onChange={(v) => handleParameterChange('connectorLength', v)}
		/>
        
        <ParameterControl
			field={FLUTE_FIELDS.numberOfCuts}
			value={$fluteParams.numberOfCuts}
			getDefault={() => DEFAULT_PARAMETERS.numberOfCuts}
			onChange={(v) => handleParameterChange('numberOfCuts', v)}
		/>
		
		{#each Array(($fluteParams.numberOfCuts)) as _, i}
			<ParameterControl
				field={FLUTE_FIELDS.cutDistances}
				label={`Cut ${i + 1} Distance`}
				value={$fluteParams.cutDistances[i] ?? 0}
				getDefault={() => 0}
				onChange={(v) => updateCutDistance(i, v)}
				validate={(v) => FLUTE_FIELDS.cutDistances.validate?.(v, {
					index: i,
					design: { flute: $fluteParams, toneHoles: $toneHoleParams }
				}) ?? { status: 'success' }}
			/>
		{/each}
	</div>

	<div class="step-nav">
		<button class="w-full btn-primary" on:click={handleExport}>
			Export
			<i class="bi bi-download"></i>
		</button>
		<button
			on:click={onBack}
			class="w-full btn-secondary">
			<i class="bi bi-arrow-left"></i>
			Back
		</button>
	</div>

    <ExportModal
        bind:this={exportModalRef}
        bind:open={exportModalOpen}
        onClose={() => exportModalOpen = false}
    />
</div>

