<script lang="ts">
	import type { AudioAnalysisResult } from '$lib/audio/audioAnalyzer';

	export let analysis: AudioAnalysisResult;
	export let predictedFrequency: number | null = null;
	export let tuningAccuracy: {
		centsOff: number;
		percentDifference: number;
		inTune: boolean;
	} | null = null;
	export let pitchStability: {
		mean: number;
		stdDev: number;
		stability: number;
	} | null = null;

	function getClarityColor(clarity: number): string {
		if (clarity > 0.8) return 'text-green-400';
		if (clarity > 0.6) return 'text-yellow-400';
		if (clarity > 0.4) return 'text-orange-400';
		return 'text-red-400';
	}

	function getTuningColor(centsOff: number): string {
		const absCents = Math.abs(centsOff);
		if (absCents < 5) return 'text-green-400';
		if (absCents < 10) return 'text-yellow-400';
		if (absCents < 20) return 'text-orange-400';
		return 'text-red-400';
	}
</script>

<div class="grid grid-cols-2 gap-4">
	<div class="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
		<h3 class="text-sm font-medium text-gray-300 mb-2">Tone Clarity</h3>
		<div class="flex items-baseline space-x-2">
			<span class="text-2xl font-bold {getClarityColor(analysis.clarity)}">
				{(analysis.clarity * 100).toFixed(0)}%
			</span>
			<span class="text-sm text-gray-400">harmonic balance</span>
		</div>
	</div>

	{#if tuningAccuracy && predictedFrequency}
		<div class="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
			<h3 class="text-sm font-medium text-gray-300 mb-2">vs Predicted</h3>
			<div class="flex items-baseline space-x-2">
				<span class="text-2xl font-bold {getTuningColor(tuningAccuracy.centsOff)}">
					{tuningAccuracy.centsOff > 0 ? '+' : ''}{tuningAccuracy.centsOff.toFixed(0)}¢
				</span>
				<span class="text-sm text-gray-400">
					({tuningAccuracy.percentDifference > 0 ? '+' : ''}{tuningAccuracy.percentDifference.toFixed(
						2
					)}%)
				</span>
			</div>
			<div class="text-xs text-gray-400 mt-1">
				Expected: {predictedFrequency.toFixed(2)} Hz
			</div>
		</div>
	{/if}

	{#if pitchStability}
		<div class="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
			<h3 class="text-sm font-medium text-gray-300 mb-2">Pitch Stability</h3>
			<div class="flex items-baseline space-x-2">
				<span class="text-2xl font-bold text-secondary-400">
					{pitchStability.stability.toFixed(0)}%
				</span>
				<span class="text-sm text-gray-400">stable</span>
			</div>
			<div class="text-xs text-gray-400 mt-1">σ = {pitchStability.stdDev.toFixed(2)} Hz</div>
		</div>
	{/if}

	<div class="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
		<h3 class="text-sm font-medium text-gray-300 mb-2">Signal Level</h3>
		<div class="flex items-baseline space-x-2">
			<span class="text-2xl font-bold text-secondary-400">
				{(analysis.amplitude * 100).toFixed(0)}%
			</span>
			<span class="text-sm text-gray-400">amplitude</span>
		</div>
	</div>
</div>
