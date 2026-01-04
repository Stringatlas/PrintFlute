<script lang="ts">
	import { onDestroy } from 'svelte';
	import { AudioAnalyzer } from '$lib/audio/audioAnalyzer';
	import { audioStore, updateAnalysis, setRecording, tuningAccuracy, pitchStability } from '$lib/stores/audioStore';
	import Waveform from '$lib/components/analysis/Waveform.svelte';
	import SpectrogramViz from '$lib/components/analysis/Spectrogram.svelte';
	import DetectionMetrics from '$lib/components/analysis/DetectionMetrics.svelte';
	import HarmonicsList from '$lib/components/analysis/HarmonicsList.svelte';
	import QualityMetrics from '$lib/components/analysis/QualityMetrics.svelte';
    import ChromaticTuner from '$lib/components/analysis/ChromaticTuner.svelte';

	export let predictedFrequency: number | null = null;

	let analyzer = new AudioAnalyzer();
	let animationFrameId: number | null = null;
	let error: string | null = null;
	let sampleRate: number = 48000;

	$: if (predictedFrequency !== null) {
		audioStore.update((state) => ({ ...state, predictedFrequency }));
	}

	async function startRecording() {
		try {
			error = null;
			await analyzer.initialize();
			const audioContext = (analyzer as any).audioContext;
			if (audioContext) {
				sampleRate = audioContext.sampleRate;
			}
			setRecording(true);
			animate();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to access microphone';
			console.error('Failed to start recording:', err);
		}
	}

	async function stopRecording() {
		if (animationFrameId !== null) {
			cancelAnimationFrame(animationFrameId);
			animationFrameId = null;
		}
		await analyzer.stop();
		setRecording(false);
		updateAnalysis(null);
	}

	function animate() {
		if (!$audioStore.isRecording) return;
		const analysis = analyzer.getAnalysis();
		updateAnalysis(analysis);
		animationFrameId = requestAnimationFrame(animate);
	}

	onDestroy(async () => {
		if (animationFrameId !== null) {
			cancelAnimationFrame(animationFrameId);
		}
		await analyzer.stop();
	});
</script>

<div class="space-y-6">
	<div>
		<h2 class="text-xl font-semibold text-secondary-400 mb-4">Tuner</h2>
		<div class="space-y-4">
			<div class="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
				<div class="flex items-center justify-between mb-4">
					<div class="flex flex-col">
						<span class="text-sm font-medium text-gray-300">Microphone Input</span>
						{#if error}
							<span class="text-xs text-red-400 mt-1">{error}</span>
						{/if}
					</div>
					<button
						class="px-4 py-2 {$audioStore.isRecording
							? 'bg-red-600 hover:bg-red-700'
							: 'bg-secondary-600 hover:bg-secondary-700'} text-white rounded text-sm transition-colors duration-200"
						on:click={$audioStore.isRecording ? stopRecording : startRecording}
					>
                    <i class="bi bi-{$audioStore.isRecording ? 'stop-circle' : 'mic-fill'}"></i>
						{$audioStore.isRecording ? 'Stop Recording' : 'Start Recording'}
					</button>
				</div>
				<div class="h-2 bg-gray-700 rounded-full overflow-hidden mb-3">
					<div
						class="h-full bg-secondary-500 transition-all duration-100"
						style="width: {$audioStore.currentAnalysis
							? $audioStore.currentAnalysis.amplitude * 100
							: 0}%"
					></div>
				</div>
				<Waveform timeData={$audioStore.currentAnalysis?.timeData || null} />
			</div>

			<div class="space-y-2">
				<SpectrogramViz
					frequencyData={$audioStore.currentAnalysis?.frequencyData || null}
					{sampleRate}
				/>
			</div>
		</div>
	</div>


    <ChromaticTuner 
        centsOff={$audioStore.currentAnalysis?.centsOff} 
        noteName={$audioStore.currentAnalysis?.noteName} 
        octave={$audioStore.currentAnalysis?.octave}
        frequency={$audioStore.currentAnalysis?.fundamentalFrequency}
    />

    <!-- For debug -->
	<!-- <div class="p-4 bg-gray-900/50 rounded-lg border border-gray-600 font-mono text-xs">
		<h3 class="text-sm font-medium text-gray-300 mb-2">Debug: Current Analysis</h3>
		<pre class="text-gray-400 whitespace-pre-wrap break-all">{JSON.stringify({
			fundamentalFrequency: $audioStore.currentAnalysis?.fundamentalFrequency,
			noteName: $audioStore.currentAnalysis?.noteName,
			octave: $audioStore.currentAnalysis?.octave,
			centsOff: $audioStore.currentAnalysis?.centsOff,
			amplitude: $audioStore.currentAnalysis?.amplitude,
			clarity: $audioStore.currentAnalysis?.clarity,
			harmonicsCount: $audioStore.currentAnalysis?.harmonics?.length
		}, null, 2)}</pre>
	</div> -->
</div>
