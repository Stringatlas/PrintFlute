<script lang="ts">
	import { viewMode } from '$lib/stores/uiStore';
	import type { ParameterFieldSchema } from '$lib/domain/designSchema';
	import Tooltip from './Tooltip.svelte';

	export let field: ParameterFieldSchema;
	export let label: string | undefined = undefined;
	export let value: number | boolean;

	export let validate: ((value: number) => { status: 'success' | 'warning' | 'error'; message?: string }) | undefined = undefined;
	export let getDefault: () => number | boolean;
	export let onChange: (value: number | boolean) => void;

	// Computed parameter props
	export let computedMode: 'auto' | 'manual' | undefined = undefined;
	export let onResetComputed: (() => void) | undefined = undefined;

	import { browser } from '$app/environment';

	$: displayLabel = label ?? field.label;
	$: inputId = `param-${field.path.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`;
	let localValue = String(value);
	$: if (!browser || document.activeElement?.id !== inputId) {
		localValue = String(value);
	}

	function handleSliderInput(event: Event) {
		const target = event.target as HTMLInputElement;
		const newValue = parseFloat(target.value);
		if (!isNaN(newValue)) {
			onChange(newValue);
		}
	}

	function handleCheckboxChange(event: Event) {
		const target = event.target as HTMLInputElement;
		onChange(target.checked as any);
	}

	function handleNumberCommit() {
		const newValue = parseFloat(localValue);
		if (!isNaN(newValue)) {
			onChange(newValue);
		} else {
			localValue = String(value);
		}
	}

	function handleNumberKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			(event.target as HTMLInputElement).blur();
		}
	}

	function resetToDefault() {
		const defaultValue = getDefault();
		onChange(defaultValue);
	}

	$: isDefault = value === getDefault();
	$: isComputed = field.autoManual === true;
	$: isAutoMode = isComputed && computedMode === 'auto';
	$: fieldValidator = validate ?? field.validate;
	$: validationResult = fieldValidator && typeof value === 'number'
		? fieldValidator(value)
		: { status: 'success' as const };
	$: isVisible = field.visibility === 'always' || $viewMode === field.visibility;
	$: borderColor = validationResult.status === 'error' 
		? 'border-red-500' 
		: validationResult.status === 'warning' 
		? 'border-yellow-500' 
		: 'border-gray-700';
</script>

{#if isVisible}
	<div class="flex flex-col gap-2">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<label for={inputId} class="label">{displayLabel}</label>
				{#if field.tooltip && validationResult.status === 'success'}
					<Tooltip text={field.tooltip} type="info" />
				{:else if validationResult.status !== 'success' && validationResult.message}
					<Tooltip text={validationResult.message} type={validationResult.status} />
				{/if}
			</div>
			{#if isComputed}
				<div class="flex items-center gap-2">
					<span class="{isAutoMode ? 'badge-auto' : 'badge-manual'}">
						{isAutoMode ? 'Auto' : 'Manual'}
					</span>
					{#if !isAutoMode && onResetComputed}
						<button
							on:click={onResetComputed}
							class="btn-reset"
							title="Reset to auto-calculated"
						>
							Reset to Auto
						</button>
					{/if}
				</div>
			{:else if !field.readOnly}
				<button
					on:click={resetToDefault}
					disabled={isDefault}
					class="btn-reset"
					title="Reset to default"
				>
					Reset
				</button>
			{/if}
		</div>
		<div class="flex items-center gap-2">
			{#if field.readOnly}
				<span class="input-number {borderColor}" aria-readonly="true">{value}</span>
				<span class="text-muted min-w-15">{field.unit}</span>
			{:else if field.input === 'slider'}
				<input
					id={inputId}
					type="range"
					min={field.bounds?.min}
					max={field.bounds?.max}
					step={field.step ?? 1}
					{value}
					on:input={handleSliderInput}
					class="input-slider"
				/>
				<span class="text-muted min-w-15 text-right">{value}{field.unit}</span>
			{:else if field.input === 'checkbox'}
				<input
					id={inputId}
					type="checkbox"
					checked={typeof value === 'boolean' ? value : false}
					on:change={handleCheckboxChange}
					class="input-checkbox"
				/>
			{:else}
				<input
					id={inputId}
					type="number"
					min={field.bounds?.min}
					max={field.bounds?.max}
					step={field.step ?? 1}
					bind:value={localValue}
					on:blur={handleNumberCommit}
					on:keydown={handleNumberKeydown}
					class="input-number {borderColor}"
				/>
				<span class="text-muted min-w-15">{field.unit}</span>
			{/if}
		</div>
	</div>
{/if}

