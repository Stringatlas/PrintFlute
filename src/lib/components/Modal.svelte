<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	export let open = false;
	export let title = '';
	export let closeOnBackdrop = true;
	export let closeOnEscape = true;
	export let maxWidth = '32rem';
	export let onClose: (() => void) | undefined = undefined;

	let dialogElement: HTMLDialogElement;

	function handleClose() {
		onClose?.();
	}

	function handleBackdropClick(event: MouseEvent) {
		if (closeOnBackdrop && event.target === dialogElement) {
			handleClose();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (closeOnEscape && event.key === 'Escape') {
			event.preventDefault();
			handleClose();
		}
	}

	$: if (dialogElement) {
		if (open) {
			dialogElement.showModal();
		} else {
			dialogElement.close();
		}
	}

	onMount(() => {
		document.addEventListener('keydown', handleKeydown);
	});

	onDestroy(() => {
		document.removeEventListener('keydown', handleKeydown);
	});
</script>

<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions -->
<dialog
	bind:this={dialogElement}
	class="modal-dialog"
	style="max-width: {maxWidth}"
	on:click={handleBackdropClick}
>
	<div class="modal-content">
		{#if title || $$slots.header}
			<header class="modal-header">
				{#if $$slots.header}
					<slot name="header" />
				{:else}
					<h2 class="modal-title">{title}</h2>
				{/if}
				<button
					class="btn-icon text-neutral-400 hover:text-white hover:bg-white/10"
					on:click={handleClose}
					aria-label="Close modal"
				>
					<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
						<path
							d="M15 5L5 15M5 5L15 15"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
						/>
					</svg>
				</button>
			</header>
		{/if}

		<div class="modal-body">
			<slot />
		</div>

		{#if $$slots.footer}
			<footer class="modal-footer">
				<slot name="footer" />
			</footer>
		{/if}
	</div>
</dialog>
