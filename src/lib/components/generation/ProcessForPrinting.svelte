<script lang="ts">
	export let onBack: () => void;
</script>

<div class="space-y-6">
	<div class="text-center py-12">
		<i class="bi bi-printer text-6xl text-gray-600 mb-4"></i>
		<h3 class="text-lg font-medium text-gray-300 mb-2">Process for Printing</h3>
		<p class="text-sm text-gray-500">Configuration options coming soon</p>
	</div>

	<!-- Navigation -->
	<div class="space-y-2 mt-8">
		<button
			class="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors duration-200"
		>
			Generate STL
		</button>
		<button
			on:click={onBack}
			class="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg transition-colors duration-200 border border-gray-700 flex items-center justify-center gap-2"
		>
			<i class="bi bi-arrow-left"></i>
			Back to Main Geometry
		</button>
	</div>
</div>
