<script lang="ts">
	import { onMount } from 'svelte';

	let pointerX = $state(0);
	let pointerY = $state(0);
	let scrollY = $state(0);
	let reduceMotion = $state(false);

	onMount(() => {
		reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (reduceMotion) return;

		const onScroll = () => {
			scrollY = window.scrollY;
		};
		const onPointer = (event: PointerEvent) => {
			pointerX = event.clientX / window.innerWidth - 0.5;
			pointerY = event.clientY / window.innerHeight - 0.5;
		};

		onScroll();
		window.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('pointermove', onPointer, { passive: true });
		return () => {
			window.removeEventListener('scroll', onScroll);
			window.removeEventListener('pointermove', onPointer);
		};
	});

	function layerShift(depth: number): string {
		if (reduceMotion) return 'translate3d(0,0,0)';
		const x = pointerX * 20 * depth;
		const y = pointerY * 12 * depth + scrollY * depth * 0.12;
		return `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
	}
</script>

<div class="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
	<svg class="absolute inset-0 h-full w-full" viewBox="0 0 1440 1100" preserveAspectRatio="xMidYMid slice">
		<defs>
			<pattern id="landing-grid" width="32" height="32" patternUnits="userSpaceOnUse">
				<path d="M 32 0 L 0 0 0 32" fill="none" stroke="#1f2937" stroke-width="1" />
			</pattern>
			<pattern id="landing-grid-major" width="160" height="160" patternUnits="userSpaceOnUse">
				<path d="M 160 0 L 0 0 0 160" fill="none" stroke="#374151" stroke-width="1.25" />
			</pattern>
		</defs>
		<rect width="1440" height="1100" fill="#030712" />
		<rect width="1440" height="1100" fill="url(#landing-grid)" />
		<rect width="1440" height="1100" fill="url(#landing-grid-major)" />
	</svg>

	<svg
		class="absolute inset-0 h-full w-full will-change-transform"
		style="transform: {layerShift(0.1)}"
		viewBox="0 0 1440 1100"
		preserveAspectRatio="xMidYMid slice"
		fill="none"
		stroke="#065f46"
		stroke-width="1.25"
	>
		<rect x="56" y="220" width="240" height="30" rx="15" />
		<circle cx="84" cy="235" r="6" />
		<circle cx="122" cy="235" r="4.5" />
		<circle cx="154" cy="235" r="4" />
		<circle cx="186" cy="235" r="5" />
		<circle cx="218" cy="235" r="4" />
		<circle cx="250" cy="235" r="4.5" />

		<line x1="1096" y1="280" x2="1308" y2="280" stroke="#374151" />
		<circle cx="1124" cy="280" r="22" />
		<circle cx="1124" cy="280" r="14" />
		<circle cx="1124" cy="280" r="6" />
		<circle cx="1180" cy="280" r="20" />
		<circle cx="1180" cy="280" r="12" />
		<circle cx="1180" cy="280" r="5" />
		<circle cx="1236" cy="280" r="21" />
		<circle cx="1236" cy="280" r="13" />
		<circle cx="1236" cy="280" r="5.5" />
		<circle cx="1152" cy="328" r="16" />
		<circle cx="1152" cy="328" r="10" />
		<circle cx="1152" cy="328" r="4" />
		<circle cx="1208" cy="328" r="17" />
		<circle cx="1208" cy="328" r="10" />
		<circle cx="1208" cy="328" r="4.5" />
	</svg>

	<svg
		class="absolute inset-0 h-full w-full will-change-transform"
		style="transform: {layerShift(0.2)}"
		viewBox="0 0 1440 1100"
		preserveAspectRatio="xMidYMid slice"
		fill="none"
		stroke="#047857"
		stroke-width="1.25"
	>
		<line x1="780" y1="56" x2="1296" y2="56" stroke="#374151" />
		<circle cx="780" cy="56" r="7" />
		<circle cx="836" cy="56" r="5" />
		<circle cx="884" cy="56" r="6" />
		<circle cx="940" cy="56" r="4.5" />
		<circle cx="996" cy="56" r="6" />
		<circle cx="1056" cy="56" r="5" />
		<circle cx="1116" cy="56" r="5.5" />
		<circle cx="1172" cy="56" r="4" />
		<circle cx="1228" cy="56" r="6" />
		<circle cx="1284" cy="56" r="7" />

		<rect x="1080" y="820" width="200" height="26" rx="13" />
		<circle cx="1104" cy="833" r="5.5" />
		<circle cx="1136" cy="833" r="4" />
		<circle cx="1164" cy="833" r="4.5" />
		<circle cx="1194" cy="833" r="4" />
		<circle cx="1224" cy="833" r="5" />
		<circle cx="1254" cy="833" r="4" />
	</svg>

	<svg
		class="absolute inset-0 h-full w-full will-change-transform"
		style="transform: {layerShift(0.32)}"
		viewBox="0 0 1440 1100"
		preserveAspectRatio="xMidYMid slice"
		fill="none"
		stroke="#059669"
		stroke-width="1.2"
	>
		<line x1="70" y1="168" x2="246" y2="168" stroke="#374151" />
		<circle cx="82" cy="168" r="8" />
		<circle cx="118" cy="168" r="6" />
		<circle cx="150" cy="168" r="7" />
		<circle cx="184" cy="168" r="5" />
		<circle cx="216" cy="168" r="6.5" />
		<circle cx="246" cy="168" r="5.5" />
	</svg>
</div>
