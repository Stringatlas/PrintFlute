<script lang="ts">
	import { onMount } from 'svelte';

	export let timeData: Float32Array | null = null;

	let canvas: HTMLCanvasElement;

	$: if (canvas && timeData) {
		drawWaveform(timeData);
	}

	function drawWaveform(data: Float32Array) {
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const width = canvas.width;
		const height = canvas.height;

		ctx.fillStyle = '#111827';
		ctx.fillRect(0, 0, width, height);

		ctx.strokeStyle = '#10b981';
		ctx.lineWidth = 2;
		ctx.beginPath();

		const sliceWidth = width / data.length;
		let x = 0;

		for (let i = 0; i < data.length; i++) {
			const v = (data[i] + 1) / 2;
			const y = v * height;

			if (i === 0) {
				ctx.moveTo(x, y);
			} else {
				ctx.lineTo(x, y);
			}

			x += sliceWidth;
		}

		ctx.lineTo(width, height / 2);
		ctx.stroke();
	}

	onMount(() => {
		if (canvas) {
			const rect = canvas.getBoundingClientRect();
			canvas.width = rect.width * window.devicePixelRatio;
			canvas.height = rect.height * window.devicePixelRatio;
		}
	});
</script>

<div class="canvas-panel">
	<canvas bind:this={canvas} class="w-full h-24"></canvas>
</div>
