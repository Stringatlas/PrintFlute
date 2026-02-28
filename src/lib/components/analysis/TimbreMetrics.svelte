<script lang="ts">
	import type { TimbreMetrics } from '$lib/audio/audioAnalyzer';
	import Tooltip from '$lib/components/generation/form-elements/Tooltip.svelte';

	const DEFAULT_TIMBRE: TimbreMetrics = {
		spectralCentroid: 0,
		spectralFlatness: 0,
		spectralRolloff: 0,
		spectralCrest: 0,
		spectralSlope: 0,
		zeroCrossingRate: 0
	};

	export let timbre: TimbreMetrics = DEFAULT_TIMBRE;
	export let sampleRate: number = 48000;

	$: t = timbre ?? DEFAULT_TIMBRE;
	$: brightnessHz = t.spectralCentroid * (sampleRate / 2);
	$: brightnessNormalized = Math.min(brightnessHz / 4000, 1);
	$: breathiness = Math.min(t.spectralFlatness, 1);
	$: rolloffHz = t.spectralRolloff * (sampleRate / 2);
	$: rolloffNormalized = Math.min(rolloffHz / (sampleRate / 2), 1);
	$: crestNormalized = Math.min(t.spectralCrest / 50, 1);
	$: slopeNormalized = Math.min(Math.abs(t.spectralSlope) * 1000, 1);
	$: zcrNormalized = Math.min(t.zeroCrossingRate / 256, 1);

	function getBrightnessLabel(value: number): string {
		if (value < 0.25) return 'Dark';
		if (value < 0.5) return 'Warm';
		if (value < 0.75) return 'Bright';
		return 'Brilliant';
	}

	function getBreathinessLabel(value: number): string {
		if (value < 0.1) return 'Pure tone';
		if (value < 0.3) return 'Clean';
		if (value < 0.6) return 'Airy';
		return 'Breathy';
	}

	function getBarColor(value: number, invert: boolean = false): string {
		const v = invert ? 1 - value : value;
		if (v < 0.33) return 'bg-blue-500';
		if (v < 0.66) return 'bg-emerald-500';
		return 'bg-amber-500';
	}
</script>

<div class="card">
	<h3 class="stat-label mb-3">Timbre Characteristics</h3>
	<div class="space-y-3">
		<div>
			<div class="flex items-center justify-between mb-1">
				<div class="flex items-center gap-1.5">
					<span class="text-xs text-gray-400">Brightness</span>
					<Tooltip
						text="Spectral centroid: the weighted mean frequency of the spectrum. Higher values indicate a brighter, more piercing tone. Lower values indicate a warmer, darker sound."
					/>
				</div>
				<span class="text-xs font-mono text-gray-300">
					{getBrightnessLabel(brightnessNormalized)} ({brightnessHz.toFixed(0)} Hz)
				</span>
			</div>
			<div class="h-1.5 bg-gray-700 rounded-full overflow-hidden">
				<div
					class="h-full rounded-full transition-all duration-150 {getBarColor(brightnessNormalized)}"
					style="width: {brightnessNormalized * 100}%"
				></div>
			</div>
		</div>

		<div>
			<div class="flex items-center justify-between mb-1">
				<div class="flex items-center gap-1.5">
					<span class="text-xs text-gray-400">Breathiness</span>
					<Tooltip
						text="Spectral flatness: how noise-like vs tonal the sound is. Values near 0 indicate a pure tone with clear harmonics. Higher values indicate more air noise, common in breathy flute playing."
					/>
				</div>
				<span class="text-xs font-mono text-gray-300">
					{getBreathinessLabel(breathiness)} ({(breathiness * 100).toFixed(0)}%)
				</span>
			</div>
			<div class="h-1.5 bg-gray-700 rounded-full overflow-hidden">
				<div
					class="h-full rounded-full transition-all duration-150 {getBarColor(breathiness)}"
					style="width: {breathiness * 100}%"
				></div>
			</div>
		</div>

		<div>
			<div class="flex items-center justify-between mb-1">
				<div class="flex items-center gap-1.5">
					<span class="text-xs text-gray-400">High-Frequency Content</span>
					<Tooltip
						text="Spectral rolloff: the frequency below which 85% of the spectral energy is concentrated. Higher rolloff means more high-frequency overtones and a richer timbre."
					/>
				</div>
				<span class="text-xs font-mono text-gray-300">{rolloffHz.toFixed(0)} Hz</span>
			</div>
			<div class="h-1.5 bg-gray-700 rounded-full overflow-hidden">
				<div
					class="h-full rounded-full transition-all duration-150 {getBarColor(rolloffNormalized)}"
					style="width: {rolloffNormalized * 100}%"
				></div>
			</div>
		</div>

		<div>
			<div class="flex items-center justify-between mb-1">
				<div class="flex items-center gap-1.5">
					<span class="text-xs text-gray-400">Fundamental Dominance</span>
					<Tooltip
						text="Spectral crest: the peak-to-average ratio of the spectrum. High values mean the fundamental stands out strongly above the overtones. Low values indicate energy is spread evenly across harmonics."
					/>
				</div>
				<span class="text-xs font-mono text-gray-300">{t.spectralCrest.toFixed(1)}</span>
			</div>
			<div class="h-1.5 bg-gray-700 rounded-full overflow-hidden">
				<div
					class="h-full rounded-full transition-all duration-150 {getBarColor(crestNormalized)}"
					style="width: {crestNormalized * 100}%"
				></div>
			</div>
		</div>

		<div>
			<div class="flex items-center justify-between mb-1">
				<div class="flex items-center gap-1.5">
					<span class="text-xs text-gray-400">Harmonic Decay</span>
					<Tooltip
						text="Spectral slope: the rate at which harmonic energy decreases across the spectrum. A steep slope means fewer overtones (purer tone). A shallow slope means rich overtone content."
					/>
				</div>
				<span class="text-xs font-mono text-gray-300">
					{slopeNormalized < 0.33 ? 'Rich' : slopeNormalized < 0.66 ? 'Moderate' : 'Pure'}
				</span>
			</div>
			<div class="h-1.5 bg-gray-700 rounded-full overflow-hidden">
				<div
					class="h-full rounded-full transition-all duration-150 {getBarColor(slopeNormalized, true)}"
					style="width: {slopeNormalized * 100}%"
				></div>
			</div>
		</div>

		<div>
			<div class="flex items-center justify-between mb-1">
				<div class="flex items-center gap-1.5">
					<span class="text-xs text-gray-400">Zero-Crossing Rate</span>
					<Tooltip
						text="How often the waveform crosses the zero line per frame. Higher values correlate with noisier, more sibilant sound. Pure tones have lower zero-crossing rates matching their fundamental frequency."
					/>
				</div>
				<span class="text-xs font-mono text-gray-300">{t.zeroCrossingRate.toFixed(0)}</span>
			</div>
			<div class="h-1.5 bg-gray-700 rounded-full overflow-hidden">
				<div
					class="h-full rounded-full transition-all duration-150 {getBarColor(zcrNormalized)}"
					style="width: {zcrNormalized * 100}%"
				></div>
			</div>
		</div>
	</div>
</div>
