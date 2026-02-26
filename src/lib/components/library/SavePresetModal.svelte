<script lang="ts">
	import Modal from '$lib/components/Modal.svelte';

	let {
		open = false,
		onClose,
		onSave,
	}: {
		open: boolean;
		onClose: () => void;
		onSave: (name: string, description: string) => void;
	} = $props();

	let name = $state('');
	let description = $state('');

	$effect(() => {
		if (open) {
			name = '';
			description = '';
		}
	});

	function handleSave() {
		if (!name.trim()) return;
		onSave(name.trim(), description.trim());
	}
</script>

<Modal {open} title="Save Current Design" {onClose}>
	<div class="space-y-4">
		<div>
			<label for="preset-name" class="label mb-1">Name</label>
			<input
				id="preset-name"
				type="text"
				bind:value={name}
				placeholder="e.g. D5 Concert Flute"
				class="input w-full"
				onkeydown={(e) => e.key === 'Enter' && handleSave()}
			/>
		</div>
		<div>
			<label for="preset-desc" class="label mb-1">Description (optional)</label>
			<textarea
				id="preset-desc"
				bind:value={description}
				placeholder="Notes about this design..."
				rows="3"
				class="input w-full resize-none"
			></textarea>
		</div>
	</div>
	<svelte:fragment slot="footer">
		<button class="btn-secondary btn-sm" onclick={onClose}>Cancel</button>
		<button class="btn-primary btn-sm" onclick={handleSave} disabled={!name.trim()}>
			<i class="bi bi-check-lg"></i>
			Save
		</button>
	</svelte:fragment>
</Modal>
