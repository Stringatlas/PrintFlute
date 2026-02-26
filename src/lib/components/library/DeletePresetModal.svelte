<script lang="ts">
	import Modal from '$lib/components/Modal.svelte';

	let {
		open = false,
		presetName = '',
		onClose,
		onConfirm,
	}: {
		open: boolean;
		presetName: string;
		onClose: () => void;
		onConfirm: () => void;
	} = $props();
</script>

<Modal {open} title="Delete Preset" {onClose} maxWidth="24rem">
	<p class="text-gray-300">
		Are you sure you want to delete <strong class="text-white">{presetName}</strong>? This cannot be undone.
	</p>
	<svelte:fragment slot="footer">
		<button class="btn-secondary btn-sm" onclick={onClose}>Cancel</button>
		<button class="btn-danger btn-sm" onclick={onConfirm}>
			<i class="bi bi-trash3"></i>
			Delete
		</button>
	</svelte:fragment>
</Modal>
