<script lang="ts">
	import type { AudioAnalysisResult } from '$lib/audio/audioAnalyzer';
	import ChromaticTuner from '$lib/components/analysis/ChromaticTuner.svelte';

	export let analysis: AudioAnalysisResult;

	function formatFrequency(freq: number): string {
		return freq.toFixed(2);
	}
</script>

<div>
	<h2 class="text-xl font-semibold text-secondary-400 mb-4">Current Detection</h2>
	<div class="grid grid-cols-2 gap-4">
		<ChromaticTuner 
			centsOff={analysis.centsOff} 
			noteName={analysis.noteName} 
			octave={analysis.octave} 
            frequency={analysis.fundamentalFrequency}
		/>
		
		<div class="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
			<div class="text-sm text-gray-400 mb-1">Frequency</div>
			<div class="text-3xl font-bold text-secondary-400">
				{formatFrequency(analysis.fundamentalFrequency)}
			</div>
			<div class="text-xs text-gray-400 mt-1">Hz</div>
		</div>
	</div>
</div>
