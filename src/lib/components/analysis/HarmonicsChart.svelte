<script lang="ts">
	import { onMount } from 'svelte';
	import { Chart, type ChartConfiguration } from 'chart.js/auto';

	export let harmonics: number[];
	export let amplitudes: number[];
	export let maxHarmonics: number = 10;

	let chartCanvas: HTMLCanvasElement;
	let chart: Chart;

	$: fundamentalAmplitude = amplitudes[0] || -90;
	$: fundamentalFrequency = harmonics[0] || 0;
	
	$: relativeAmplitudes = amplitudes.map(amp => {
		const linearFundamental = Math.pow(10, fundamentalAmplitude / 20);
		const linearHarmonic = Math.pow(10, amp / 20);
		return (linearHarmonic / linearFundamental) * 100;
	});
	
	$: chartData = relativeAmplitudes.slice(0, maxHarmonics);
	$: labels = Array.from({ length: maxHarmonics }, (_, i) => i === 0 ? 'F' : `${i + 1}x`);
	$: backgroundColors = Array.from({ length: maxHarmonics }, (_, i) => 
		i === 0 ? 'rgb(251, 146, 60)' : 'rgb(96, 165, 250)'
	);

	$: if (chart && chartData) {
		chart.data.labels = labels;
		chart.data.datasets[0].data = chartData;
		chart.data.datasets[0].backgroundColor = backgroundColors;
		chart.update('none');
	}

	onMount(() => {
		const config: ChartConfiguration = {
			type: 'bar',
			data: {
				labels,
				datasets: [{
					label: 'Amplitude (%)',
					data: chartData,
					backgroundColor: backgroundColors,
					borderColor: 'rgba(0, 0, 0, 0)',
					borderWidth: 0
				}]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				animation: {
					duration: 0
				},
				plugins: {
					legend: {
						display: false
					},
					tooltip: {
						callbacks: {
							label: (context: any) => {
								const index = context.dataIndex;
								const percent = context.parsed.y.toFixed(1);
								const db = amplitudes[index]?.toFixed(1) || '0.0';
								return `${percent}% (${db} dB)`;
							}
						}
					}
				},
				scales: {
					y: {
						min: 0,
						max: 100,
						ticks: {
							callback: (value: any) => `${value}%`,
							color: 'rgb(156, 163, 175)'
						},
						grid: {
							color: 'rgba(75, 85, 99, 0.3)'
						}
					},
					x: {
						ticks: {
							color: 'rgb(156, 163, 175)'
						},
						grid: {
							display: false
						}
					}
				}
			}
		};

		chart = new Chart(chartCanvas, config);

		return () => {
			chart.destroy();
		};
	});
</script>

<div class="flex flex-col gap-4">
	<!-- Header with fundamental info -->
	<div class="flex justify-between items-top">
		<h2 class="text-xl font-semibold text-secondary-400">Harmonic Spectrum</h2>
		<div class="text-right">
			<div class="text-sm text-gray-400">Fundamental</div>
			<div class="text-lg font-mono text-secondary-400">
				{fundamentalFrequency.toFixed(2)} Hz
			</div>
			<div class="text-xs text-gray-500">
				{fundamentalAmplitude.toFixed(1)} dB
			</div>
		</div>
	</div>
	
	<div class="bg-gray-800/50 rounded border border-gray-700 p-4 h-64">
		<canvas bind:this={chartCanvas}></canvas>
	</div>
	
	<div class="flex gap-4 text-xs text-gray-400 justify-center">
		<div class="flex items-center gap-2">
			<div class="w-3 h-3 bg-secondary-500 rounded"></div>
			<span>Fundamental</span>
		</div>
		<div class="flex items-center gap-2">
			<div class="w-3 h-3 bg-primary-500 rounded"></div>
			<span>Harmonics</span>
		</div>
	</div>
</div>
