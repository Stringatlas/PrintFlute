<script lang="ts">
	export let harmonics: number[];
	export let amplitudes: number[];

	function formatFrequency(freq: number): string {
		return freq.toFixed(2);
	}
</script>

<div>
	<h2 class="text-xl font-semibold text-secondary-400 mb-4">Harmonics</h2>
	<div class="space-y-2">
		{#each harmonics.slice(0, 6) as harmonic, i}
			<div class="p-3 bg-gray-800/50 rounded border border-gray-700">
				<div class="flex justify-between items-center">
					<span class="text-sm text-gray-300">
						{i === 0 ? 'Fundamental' : `${i + 1}x Harmonic`}
					</span>
					<div class="flex items-center gap-3">
						<span class="text-sm font-mono text-secondary-400">
							{formatFrequency(harmonic)} Hz
						</span>
						<div class="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
							<div
								class="h-full bg-secondary-500"
								style="width: {Math.max(0, (amplitudes[i] + 90) * 1.11)}%"
							></div>
						</div>
					</div>
				</div>
			</div>
		{/each}
	</div>
</div>
