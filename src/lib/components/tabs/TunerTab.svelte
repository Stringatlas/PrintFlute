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
		<h2 class="heading-page mb-4">Tuner</h2>
		<div class="space-y-4">
			<div class="card">
				<div class="flex items-center justify-between mb-4">
					<div class="flex flex-col">
						<span class="text-sm font-medium text-gray-300">Microphone Input</span>
						{#if error}
							<span class="text-xs text-red-400 mt-1">{error}</span>
						{/if}
					</div>
					<button
						class="btn-sm {$audioStore.isRecording ? 'btn-danger' : 'btn-primary'}"
						on:click={$audioStore.isRecording ? stopRecording : startRecording}
					>
                    <i class="bi bi-{$audioStore.isRecording ? 'stop-circle' : 'mic-fill'}"></i>
						{$audioStore.isRecording ? 'Stop Recording' : 'Start Recording'}
					</button>
				</div>
				<div class="progress-bar mb-3">
					<div
						class="progress-bar-fill"
						style="width: {$audioStore.currentAnalysis
							? $audioStore.currentAnalysis.amplitude * 100
							: 0}%"
					></div>
				</div>
				<Waveform timeData={$audioStore.currentAnalysis?.timeData || null} />
			</div>

            <ChromaticTuner 
                centsOff={$audioStore.currentAnalysis?.centsOff} 
                noteName={$audioStore.currentAnalysis?.noteName} 
                octave={$audioStore.currentAnalysis?.octave}
                frequency={$audioStore.currentAnalysis?.fundamentalFrequency}
            />

			<div class="space-y-2">
				<SpectrogramViz
					frequencyData={$audioStore.currentAnalysis?.frequencyData || null}
					{sampleRate}
				/>
			</div>
		</div>
	</div>
</div>
