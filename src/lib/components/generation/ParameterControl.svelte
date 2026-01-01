<script lang="ts">
	import { viewMode } from '$lib/stores/fluteStore';

	export let label: string;
	export let value: number;
	export let min: number | undefined = undefined;
	export let max: number | undefined = undefined;
	export let step: number = 1;
	export let unit: string = '';
	export let inputType: 'slider' | 'number' = 'number';

	const inputId = `param-${label.replace(/\s+/g, '-').toLowerCase()}`;
	export let visibility: 'always' | 'basic' | 'advanced' = 'always';
	export let validate: ((value: number) => { status: 'success' | 'warning' | 'error'; message?: string }) | undefined = undefined;
	export let getDefault: () => number;
	export let onChange: (value: number) => void;

	let showTooltip = false;

	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		const newValue = parseFloat(target.value);
		if (!isNaN(newValue)) {
			onChange(newValue);
		}
	}

	function resetToDefault() {
		const defaultValue = getDefault();
		onChange(defaultValue);
	}

	$: isDefault = value === getDefault();
	$: validationResult = validate ? validate(value) : { status: 'success' as const };
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
				{#if validationResult.status !== 'success' && validationResult.message}
					<div class="relative">
						<button
							type="button"
							on:mouseenter={() => showTooltip = true}
							on:mouseleave={() => showTooltip = false}
							class="flex items-center justify-center w-4 h-4 rounded-full {validationResult.status === 'error' 
								? 'text-red-400' 
								: 'text-yellow-400'}"
						>
							{#if validationResult.status === 'error'}
								<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
									<path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
									<path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
								</svg>
							{:else}
								<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
									<path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
								</svg>
							{/if}
						</button>
						{#if showTooltip}
							<div class="absolute left-0 bottom-full mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap z-10 border border-gray-700 shadow-lg">
								{validationResult.message}
								<div class="absolute left-2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
							</div>
						{/if}
					</div>
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
