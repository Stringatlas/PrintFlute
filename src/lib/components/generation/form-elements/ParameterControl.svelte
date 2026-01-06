<script lang="ts">
	import { viewMode } from '$lib/stores/fluteStore';
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

	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		if (inputType === 'checkbox') {
			onChange(target.checked as any);
		} else {
			const newValue = parseFloat(target.value);
			if (!isNaN(newValue)) {
				onChange(newValue);
			}
		}
	}

	function resetToDefault() {
		const defaultValue = getDefault();
		onChange(defaultValue);
	}

	$: isDefault = value === getDefault();
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
				<label for={inputId} class="block text-sm font-medium text-gray-300">{label}</label>
				{#if info && validationResult.status === 'success'}
					<Tooltip text={info} type="info" />
				{:else if validationResult.status !== 'success' && validationResult.message}
					<Tooltip text={validationResult.message} type={validationResult.status} />
				{/if}
			</div>
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
			{#if inputType === 'slider'}
				<input
					id={inputId}
					type="range"
					{min}
					{max}
					{step}
					{value}
					on:input={handleInput}
					class="w-64 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
				/>
				<span class="text-sm text-gray-400 min-w-[60px] text-right">{value}{unit}</span>
			{:else if inputType === 'checkbox'}
				<input
					id={inputId}
					type="checkbox"
					checked={typeof value === 'boolean' ? value : false}
					on:change={handleInput}
					class="w-4 h-4 bg-gray-800 border border-gray-700 rounded text-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-gray-900"
				/>
			{:else}
				<input
					id={inputId}
					type="number"
					{min}
					{max}
					{step}
					{value}
					on:input={handleInput}
					class="w-32 px-3 py-1.5 bg-gray-800 border {borderColor} rounded-lg text-gray-200 focus:outline-none focus:border-primary-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
				/>
				<span class="text-sm text-gray-400 min-w-[60px]">{unit}</span>
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
