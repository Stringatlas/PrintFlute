<script lang="ts">
	import Modal from '$lib/components/Modal.svelte';
	import type { FlutePreset } from '$lib/stores/libraryStore';

	let {
		open = false,
		preset = null,
		onClose,
		onSave,
	}: {
		open: boolean;
		preset: FlutePreset | null;
		onClose: () => void;
		onSave: (name: string, description: string) => void;
	} = $props();

	let name = $state('');
	let description = $state('');

	$effect(() => {
		if (open && preset) {
			name = preset.name;
			description = preset.description;
		}
	});

	function handleSave() {
		if (!name.trim()) return;
		onSave(name.trim(), description.trim());
	}
</script>

<Modal {open} title="Edit Preset" {onClose}>
	<div class="space-y-4">
		<div>
			<label for="edit-name" class="label mb-1">Name</label>
			<input
				id="edit-name"
				type="text"
				bind:value={name}
				class="input w-full"
				onkeydown={(e) => e.key === 'Enter' && handleSave()}
			/>
		</div>
		<div>
			<label for="edit-desc" class="label mb-1">Description</label>
			<textarea
				id="edit-desc"
				bind:value={description}
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
