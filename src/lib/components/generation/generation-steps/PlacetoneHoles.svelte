<script lang="ts">
    export let onBack: () => void;
    export let onNext: () => void;
</script>

<div class="space-y-6">
	<div class="space-y-4">
		<h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wide">Tone Hole Placement</h3>

	</div>

	<!-- Navigation -->
	<div class="space-y-2 mt-8">
		<button
			on:click={onNext}
			class="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
		>
			Next Step
			<i class="bi bi-arrow-right"></i>
		</button>
		<button
			on:click={onBack}
			class="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg transition-colors duration-200 border border-gray-700 flex items-center justify-center gap-2"
		>
			<i class="bi bi-arrow-left"></i>
			Back
		</button>
	</div>
</div>