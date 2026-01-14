<script lang="ts">
	export let text: string;
	export let type: 'info' | 'error' | 'warning' = 'info';
	export let imageSrc: string | undefined = undefined;
	export let imageAlt: string = '';
	
	let showTooltip = false;
	let buttonElement: HTMLButtonElement;
	let tooltipX = 0;
	let tooltipY = 0;
	
	$: iconClass = type === 'error' 
		? 'text-red-400' 
		: type === 'warning' 
		? 'text-yellow-400' 
		: 'text-gray-400 hover:text-primary-400';
	
	$: icon = type === 'error' 
		? 'bi-exclamation-circle-fill' 
		: type === 'warning' 
		? 'bi-exclamation-triangle-fill' 
		: 'bi-info-circle';

	function updateTooltipPosition() {
		if (buttonElement) {
			const rect = buttonElement.getBoundingClientRect();
			tooltipX = rect.left;
			tooltipY = rect.bottom + 8;
		}
	}

	function handleMouseEnter() {
		showTooltip = true;
		updateTooltipPosition();
	}

	function handleMouseLeave() {
		showTooltip = false;
	}
</script>

<button
	bind:this={buttonElement}
	type="button"
	on:mouseenter={handleMouseEnter}
	on:mouseleave={handleMouseLeave}
	class="flex items-center justify-center w-4 h-4 rounded-full {iconClass} transition-colors"
	aria-label={type === 'error' ? 'Validation error' : type === 'warning' ? 'Validation warning' : 'Information'}
>
	<i class="bi {icon} text-sm"></i>
</button>

{#if showTooltip}
	<div 
		class="fixed px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-pre-wrap w-64 z-9999 border border-gray-700 shadow-lg pointer-events-none"
		style="left: {tooltipX}px; top: {tooltipY}px;"
	>
		{text}
		{#if imageSrc}
			<img src={imageSrc} alt={imageAlt} class="mt-2 w-full rounded border border-gray-700" />
		{/if}
		<div class="absolute left-2 bottom-full w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></div>
	</div>
{/if}
