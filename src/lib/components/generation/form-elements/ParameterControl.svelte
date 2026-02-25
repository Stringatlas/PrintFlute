<script lang="ts">
	import { viewMode } from '$lib/stores/uiStore';
	import Tooltip from './Tooltip.svelte';

	export let label: string;
	export let value: number | boolean;
	export let min: number | undefined = undefined;
	export let max: number | undefined = undefined;
	export let step: number = 1;
	export let unit: string = '';
	export let inputType: 'slider' | 'number' | 'checkbox' = 'number';

	const inputId = `param-${label.replace(/\s+/g, '-').toLowerCase()}`;
	export let visibility: 'always' | 'basic' | 'advanced' = 'always';
	export let validate: ((value: number) => { status: 'success' | 'warning' | 'error'; message?: string }) | undefined = undefined;
	export let getDefault: () => number | boolean;
	export let onChange: (value: number | boolean) => void;
	export let info: string | undefined = undefined;

	// Computed parameter props
	export let isComputed: boolean = false;
	export let computedMode: 'auto' | 'manual' | undefined = undefined;
	export let onResetComputed: (() => void) | undefined = undefined;

	import { browser } from '$app/environment';

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
	$: isAutoMode = isComputed && computedMode === 'auto';
	$: validationResult = validate && typeof value === 'number' ? validate(value) : { status: 'success' as const };
	$: isVisible = visibility === 'always' || $viewMode === visibility;
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
				<label for={inputId} class="label">{label}</label>
				{#if info && validationResult.status === 'success'}
					<Tooltip text={info} type="info" />
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
			{:else}
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
			{#if inputType === 'slider'}
				<input
					id={inputId}
					type="range"
					{min}
					{max}
					{step}
					{value}
					on:input={handleSliderInput}
					class="input-slider"
				/>
				<span class="text-muted min-w-15 text-right">{value}{unit}</span>
			{:else if inputType === 'checkbox'}
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
					{min}
					{max}
					{step}
					bind:value={localValue}
					on:blur={handleNumberCommit}
					on:keydown={handleNumberKeydown}
					class="input-number {borderColor}"
				/>
				<span class="text-muted min-w-15">{unit}</span>
			{/if}
		</div>
	</div>
{/if}

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
