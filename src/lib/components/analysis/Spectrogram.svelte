<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { SpectrogramRenderer } from '$lib/utils/spectrogramRenderer';

	export let frequencyData: Float32Array | null = null;
	export let sampleRate: number = 48000;

	let canvas: HTMLCanvasElement;
	let renderer: SpectrogramRenderer | null = null;
	let lastData: Float32Array | null = null;

	$: if (renderer && frequencyData && frequencyData !== lastData) {
		renderer.addFrequencyData(frequencyData, sampleRate);
		renderer.render();
		lastData = frequencyData;
	}

	onMount(() => {
		if (canvas) {
			const rect = canvas.getBoundingClientRect();
			canvas.width = rect.width * window.devicePixelRatio;
			canvas.height = rect.height * window.devicePixelRatio;
			renderer = new SpectrogramRenderer(canvas);
		}
	});

	onDestroy(() => {
		renderer = null;
		lastData = null;
	});
</script>

<div class="bg-gray-900 rounded-lg border border-gray-700 p-2 relative">
	<!-- <div class="text-xs text-gray-400 mb-1">Spectrogram (Time vs Frequency)</div> -->
	<canvas bind:this={canvas} class="w-full h-64"></canvas>
</div>
