<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import * as d3 from 'd3';
	import { buildPrintLayers, PRINT_VIEW, type PrintDemoParams } from './printLayers';

	let {
		boreDiameter = 14.3,
		wallThickness = 2.5,
		holeCount = 6
	}: PrintDemoParams = $props();

	let host: HTMLDivElement | undefined;
	let svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | undefined;
	let timer: d3.Timer | undefined;
	let reducedMotion = $state(false);
	let ready = $state(false);
	let finished = $state(false);

	const COOLED = '#10b981';
	const HOT = '#fb923c';
	const BED = '#374151';
	const RAIL = '#4b5563';

	$effect(() => {
		boreDiameter;
		wallThickness;
		holeCount;
		if (ready) startPrint();
	});

	onMount(() => {
		reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		svg = d3
			.select(host!)
			.append('svg')
			.attr('viewBox', `0 0 ${PRINT_VIEW.width} ${PRINT_VIEW.height}`)
			.attr('class', 'h-full w-full')
			.attr('role', 'img')
			.attr('aria-label', 'A flute being 3D printed layer by layer');
		ready = true;
	});

	onDestroy(() => {
		timer?.stop();
		svg?.remove();
	});

	function startPrint() {
		if (!svg) return;
		finished = false;
		timer?.stop();
		svg.selectAll('*').interrupt();
		svg.selectAll('*').remove();

		const layers = buildPrintLayers({ boreDiameter, wallThickness, holeCount });
		const root = svg.append('g');

		drawBed(root);
		drawGuides(root);

		const layerGroup = root.append('g').attr('class', 'print-layers');
		const nozzle = drawNozzle(root);

		if (reducedMotion || layers.length === 0) {
			for (const layer of layers) {
				for (const segment of layer.segments) {
					layerGroup
						.append('line')
						.attr('x1', segment.x0)
						.attr('x2', segment.x1)
						.attr('y1', layer.y)
						.attr('y2', layer.y)
						.attr('stroke', COOLED)
						.attr('stroke-width', 3.2)
						.attr('stroke-linecap', 'round');
				}
			}
			nozzle.attr('opacity', 0);
			finished = true;
			return;
		}

		const jobs = layers.flatMap((layer, layerIndex) => {
			const direction = layerIndex % 2 === 0 ? 1 : -1;
			const ordered = direction === 1 ? layer.segments : [...layer.segments].reverse();
			return ordered.map((segment) => {
				const from = direction === 1 ? segment.x0 : segment.x1;
				const to = direction === 1 ? segment.x1 : segment.x0;
				return { y: layer.y, from, to, layerIndex };
			});
		});

		let jobIndex = 0;
		let elapsed = 0;
		const travelMs = 34;
		const drawMs = 86;

		positionNozzle(nozzle, jobs[0]?.from ?? 400, jobs[0]?.y ?? 280);

		timer = d3.timer((now) => {
			if (jobIndex >= jobs.length) {
				layerGroup.select<SVGLineElement>(`#seg-${jobs.length - 1}`).attr('stroke', COOLED);
				nozzle.attr('opacity', 0);
				timer?.stop();
				finished = true;
				return;
			}

			const job = jobs[jobIndex];
			const local = now - elapsed;

			if (local < travelMs) {
				const previous = jobs[jobIndex - 1];
				const startX = previous?.to ?? job.from;
				const startY = previous?.y ?? job.y - 8;
				const t = local / travelMs;
				const x = startX + (job.from - startX) * t;
				const y = startY + (job.y - startY) * t;
				positionNozzle(nozzle, x, y);
				return;
			}

			// Cooling is discrete: the previous extrusion stays hot through travel,
			// then turns green exactly when the next extrusion begins.
			if (jobIndex > 0) {
				layerGroup.select<SVGLineElement>(`#seg-${jobIndex - 1}`).attr('stroke', COOLED);
			}

			const drawT = Math.min(1, (local - travelMs) / drawMs);
			const x = job.from + (job.to - job.from) * drawT;
			positionNozzle(nozzle, x, job.y);

			const id = `seg-${jobIndex}`;
			let line = layerGroup.select<SVGLineElement>(`#${id}`);
			if (line.empty()) {
				line = layerGroup
					.append('line')
					.attr('id', id)
					.attr('x1', job.from)
					.attr('y1', job.y)
					.attr('x2', job.from)
					.attr('y2', job.y)
					.attr('stroke', HOT)
					.attr('stroke-width', 3.4)
					.attr('stroke-linecap', 'round');
			}
			line.attr('x2', x);

			if (drawT >= 1) {
				elapsed += travelMs + drawMs;
				jobIndex += 1;
			}
		});
	}

	function drawBed(root: d3.Selection<SVGGElement, unknown, null, undefined>) {
		root
			.append('rect')
			.attr('x', 36)
			.attr('y', PRINT_VIEW.bedY)
			.attr('width', PRINT_VIEW.width - 72)
			.attr('height', 14)
			.attr('rx', 3)
			.attr('fill', BED);
		root
			.append('rect')
			.attr('x', 28)
			.attr('y', PRINT_VIEW.bedY + 14)
			.attr('width', PRINT_VIEW.width - 56)
			.attr('height', 10)
			.attr('rx', 2)
			.attr('fill', '#1f2937');

		for (let i = 0; i < 18; i++) {
			root
				.append('line')
				.attr('x1', 48 + i * 40)
				.attr('x2', 48 + i * 40)
				.attr('y1', PRINT_VIEW.bedY)
				.attr('y2', PRINT_VIEW.bedY + 14)
				.attr('stroke', '#111827')
				.attr('stroke-width', 1)
				.attr('opacity', 0.5);
		}
	}

	function drawGuides(root: d3.Selection<SVGGElement, unknown, null, undefined>) {
		const grid = root.append('g').attr('opacity', 0.18);
		for (let x = 64; x <= PRINT_VIEW.width - 64; x += 28) {
			grid
				.append('line')
				.attr('x1', x)
				.attr('x2', x)
				.attr('y1', 64)
				.attr('y2', PRINT_VIEW.bedY)
				.attr('stroke', '#6b7280')
				.attr('stroke-width', 1);
		}
		for (let y = 80; y < PRINT_VIEW.bedY; y += 16) {
			grid
				.append('line')
				.attr('x1', 56)
				.attr('x2', PRINT_VIEW.width - 56)
				.attr('y1', y)
				.attr('y2', y)
				.attr('stroke', '#6b7280')
				.attr('stroke-width', 1);
		}

		root
			.append('line')
			.attr('x1', 48)
			.attr('x2', PRINT_VIEW.width - 48)
			.attr('y1', 52)
			.attr('y2', 52)
			.attr('stroke', RAIL)
			.attr('stroke-width', 3)
			.attr('stroke-linecap', 'round');
	}

	function drawNozzle(root: d3.Selection<SVGGElement, unknown, null, undefined>) {
		const nozzle = root.append('g').attr('class', 'print-nozzle');
		nozzle
			.append('line')
			.attr('class', 'nozzle-feed')
			.attr('x1', 0)
			.attr('x2', 0)
			.attr('y1', 0)
			.attr('y2', -18)
			.attr('stroke', RAIL)
			.attr('stroke-width', 2);
		nozzle
			.append('rect')
			.attr('x', -16)
			.attr('y', -28)
			.attr('width', 32)
			.attr('height', 14)
			.attr('rx', 2)
			.attr('fill', '#6b7280');
		nozzle.append('path').attr('d', 'M -8 -14 L 8 -14 L 0 2 Z').attr('fill', HOT);
		nozzle
			.append('circle')
			.attr('cy', 4)
			.attr('r', 5)
			.attr('fill', HOT)
			.attr('opacity', 0.35);
		return nozzle;
	}

	function positionNozzle(
		nozzle: d3.Selection<SVGGElement, unknown, null, undefined>,
		x: number,
		y: number
	) {
		nozzle.attr('transform', `translate(${x}, ${y})`);
		nozzle.select<SVGLineElement>('.nozzle-feed').attr('y1', PRINT_VIEW.bedY > y ? 52 - y : -220);
	}
</script>

<div class="relative h-full w-full">
	<div bind:this={host} class="h-full w-full"></div>
	{#if finished && !reducedMotion}
		<button class="absolute bottom-4 right-4 rounded-lg border border-gray-700 bg-gray-950/85 px-3 py-2 text-xs text-gray-400 shadow-lg transition hover:border-gray-600 hover:text-gray-100" onclick={startPrint} aria-label="Replay printing animation">
			<i class="bi bi-arrow-clockwise mr-1.5"></i>Replay print
		</button>
	{/if}
</div>
