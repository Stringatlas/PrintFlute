<script lang="ts">
	import { onDestroy } from 'svelte';
	import { AudioAnalyzer } from '$lib/audio/audioAnalyzer';
	import { audioStore, updateAnalysis, setRecording } from '$lib/stores/audioStore';
	import Waveform from '$lib/components/analysis/Waveform.svelte';
	import SpectrogramViz from '$lib/components/analysis/Spectrogram.svelte';
	import HarmonicsChart from '$lib/components/analysis/HarmonicsChart.svelte';
	import DetectionMetrics from '$lib/components/analysis/DetectionMetrics.svelte';
	import QualityMetrics from '$lib/components/analysis/QualityMetrics.svelte';

	export let predictedFrequency: number | null = null;

	let analyzer = new AudioAnalyzer();
	let animationFrameId: number | null = null;
	let error: string | null = null;
	let sampleRate: number = 48000;

	let frozenHarmonics: number[] = [400, 600, 800, 1000, 1200];
	let frozenAmplitudes: number[] = [80, 60, 40, 20, 10];

	$: if (predictedFrequency !== null) {
		audioStore.update((state) => ({ ...state, predictedFrequency }));
	}

	$: if ($audioStore.currentAnalysis?.harmonics && $audioStore.currentAnalysis?.fundamentalFrequency > 0) {
		frozenHarmonics = $audioStore.currentAnalysis.harmonics;
		frozenAmplitudes = $audioStore.currentAnalysis.harmonicAmplitudes;
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
		frozenHarmonics = [];
		frozenAmplitudes = [];
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
		<h2 class="text-xl font-semibold text-primary-400 mb-4">Timbre Analysis</h2>
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
							: 'bg-primary-600 hover:bg-primary-700'} text-white rounded text-sm transition-colors duration-200"
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

			{#if frozenHarmonics.length > 0}
				<HarmonicsChart
					harmonics={frozenHarmonics}
					amplitudes={frozenAmplitudes}
				/>
			{/if}

			<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<!-- <DetectionMetrics
					frequency={$audioStore.currentAnalysis?.fundamentalFrequency}
					clarity={$audioStore.currentAnalysis?.clarity}
					amplitude={$audioStore.currentAnalysis?.amplitude}
				/>

				<QualityMetrics
					clarity={$audioStore.currentAnalysis?.clarity}
					amplitude={$audioStore.currentAnalysis?.amplitude}
					harmonics={$audioStore.currentAnalysis?.harmonics || []}
				/> -->
			</div>

			<SpectrogramViz
				frequencyData={$audioStore.currentAnalysis?.frequencyData || null}
				{sampleRate}
			/>
		</div>
	</div>
</div>
