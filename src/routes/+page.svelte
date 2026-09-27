<script lang="ts">
	import favicon from '$lib/assets/favicon.png';
	import LandingBackdrop from '$lib/components/landing/LandingBackdrop.svelte';
	import LandingPreview3D from '$lib/components/landing/LandingPreview3D.svelte';
	import PrintFluteAnimation from '$lib/components/landing/PrintFluteAnimation.svelte';
	import { OFFICIAL_FLUTES } from '$lib/data/officialFlutes';

	const featuredFlutes = OFFICIAL_FLUTES.filter((entry) => entry.featured);
	let selectedSlug = $state(featuredFlutes[0].slug);
	let selected = $derived(featuredFlutes.find((entry) => entry.slug === selectedSlug) ?? featuredFlutes[0]);
</script>

<svelte:head>
	<title>Print Flute — Choose, generate, and print a flute locally</title>
	<meta name="description" content="Choose a ready-made flute design and generate printable files entirely in your browser. No account, uploads, or cloud processing." />
</svelte:head>

<div class="min-h-screen overflow-hidden bg-gray-950 text-gray-100">
	<LandingBackdrop />
	<header class="relative z-20 border-b border-gray-800/80 bg-gray-950/90 backdrop-blur">
		<div class="mx-auto flex max-w-7xl items-center justify-between gap-5 px-5 py-4 sm:px-8">
			<a href="/" class="flex items-center gap-3" aria-label="Print Flute home">
				<img src={favicon} alt="" class="h-9 w-auto" />
				<span class="font-semibold tracking-tight text-gray-100">Print Flute</span>
			</a>
			<nav class="hidden items-center gap-7 text-sm text-gray-400 md:flex" aria-label="Main navigation">
				<a class="transition hover:text-gray-100" href="#library">Flute library</a>
				<a class="transition hover:text-gray-100" href="#how-it-works">How it works</a>
				<a class="transition hover:text-gray-100" href="/build?tab=designer">Advanced designer</a>
			</nav>
			<a href="/build" class="btn-primary">Browse flutes <i class="bi bi-arrow-right"></i></a>
		</div>
	</header>

	<main class="relative z-10">
		<section class="relative border-b border-gray-800/70">
			<div class="hero-glow" aria-hidden="true"></div>
			<div class="relative mx-auto grid min-h-[43rem] max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:py-24">
				<div class="max-w-xl">
					<p class="mb-5 text-sm font-medium text-primary-400">Local 3D-printable instruments</p>
					<h1 class="text-5xl font-semibold leading-[1.02] tracking-[-0.045em] text-white sm:text-6xl lg:text-7xl">A printable flute, without the setup.</h1>
					<p class="mt-7 max-w-lg text-lg leading-8 text-gray-400">Choose a ready-made instrument, adjust it only if you want, and generate the model entirely on your device.</p>
					<div class="mt-9 flex flex-wrap gap-3">
						<a href="/build" class="btn-primary min-h-12 px-5">Browse the flute library <i class="bi bi-arrow-right"></i></a>
						<a href="/build?tab=designer" class="btn-secondary min-h-12 px-5">Build from scratch</a>
					</div>
					<p class="mt-5 flex items-center gap-2 text-sm text-gray-500"><i class="bi bi-shield-check text-primary-500"></i> No account. No uploads. No cloud processing.</p>
				</div>

				<div class="relative lg:translate-x-8">
					<div class="absolute -inset-8 rounded-full bg-primary-500/5 blur-3xl" aria-hidden="true"></div>
					<div class="relative overflow-hidden rounded-3xl border border-gray-700/70 bg-gray-900/70 shadow-2xl shadow-black/40">
						<div class="h-80 sm:h-96"><PrintFluteAnimation /></div>
					</div>
				</div>
			</div>
		</section>

		<section id="library" class="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
			<div class="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
				<div class="max-w-2xl">
					<p class="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary-400">Ready-made designs</p>
					<h2 class="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Start with a flute, not a form.</h2>
					<p class="mt-3 leading-7 text-gray-400">Each design is a small parameter recipe. The actual model is generated when you open it.</p>
				</div>
				<a href="/build" class="text-sm font-medium text-primary-400 transition hover:text-primary-300">See all six designs <i class="bi bi-arrow-right ml-1"></i></a>
			</div>

			<div class="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
				{#each featuredFlutes as flute}
					<article class="flex min-h-72 flex-col rounded-2xl border border-gray-800 bg-gray-900/45 p-5 transition hover:-translate-y-1 hover:border-gray-700 hover:bg-gray-900/70">
						<div class="mb-5 flex items-center justify-between"><span class="text-sm font-medium text-primary-400">{flute.metadata.key}</span><span class="text-xs capitalize text-gray-600">{flute.metadata.size}</span></div>
						<h3 class="text-xl font-semibold text-gray-100">{flute.name}</h3>
						<p class="mt-3 text-sm leading-6 text-gray-400">{flute.description}</p>
						<div class="mt-auto pt-7">
							<div class="mb-4 flex gap-4 text-xs text-gray-500"><span>{flute.fluteParameters.numberOfToneHoles} holes</span><span>{flute.metadata.printFormat === 'one-piece' ? 'One-piece print' : 'Sectional print'}</span></div>
							<a href={`/build?design=${flute.slug}`} class="flex items-center justify-between border-t border-gray-800 pt-4 text-sm font-medium text-gray-200 transition hover:text-primary-400"><span>Use this design</span><i class="bi bi-arrow-right"></i></a>
						</div>
					</article>
				{/each}
			</div>
		</section>

		<section class="border-y border-gray-800 bg-gray-900/25 py-20 lg:py-28">
			<div class="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
				<div class="max-w-lg">
					<p class="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary-400">Hear the choice in the shape</p>
					<h2 class="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Choose an instrument character.</h2>
					<p class="mt-4 leading-7 text-gray-400">Pick a starting point and the generated geometry updates with it. Exact dimensions remain available in the advanced designer.</p>

					<div class="mt-8 space-y-2" role="listbox" aria-label="Choose a flute to preview">
						{#each featuredFlutes as flute}
							<button
								class="group flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition {selectedSlug === flute.slug ? 'border-primary-600 bg-primary-950/40' : 'border-gray-800 bg-gray-950/30 hover:border-gray-700'}"
								onclick={() => selectedSlug = flute.slug}
								role="option"
								aria-selected={selectedSlug === flute.slug}
							>
								<span><span class="font-medium text-gray-200">{flute.name}</span><span class="ml-3 text-sm text-gray-500">{flute.metadata.character}</span></span>
								<span class="text-sm text-primary-400">{flute.metadata.key}</span>
							</button>
						{/each}
					</div>
					<a href={`/build?design=${selected.slug}`} class="btn-primary mt-6 inline-flex">Open {selected.name} <i class="bi bi-arrow-right"></i></a>
				</div>

				<div class="relative lg:translate-x-10">
					<div class="h-[30rem] overflow-hidden rounded-3xl border border-gray-700 bg-gray-950 shadow-2xl shadow-black/30">
						<LandingPreview3D boreDiameter={selected.fluteParameters.boreDiameter} wallThickness={selected.fluteParameters.wallThickness} holeCount={selected.fluteParameters.numberOfToneHoles} />
					</div>
					<div class="mt-3 flex justify-end gap-5 text-xs text-gray-600"><span>{selected.fluteParameters.boreDiameter} mm bore</span><span>{selected.metadata.printFormat === 'one-piece' ? 'One-piece' : 'Sectional'}</span></div>
				</div>
			</div>
		</section>

		<section id="how-it-works" class="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
			<div class="grid gap-12 lg:grid-cols-[0.7fr_1.3fr]">
				<div><p class="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary-400">From catalog to print bed</p><h2 class="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Three deliberate steps.</h2></div>
				<ol class="grid gap-8 sm:grid-cols-3">
					<li class="border-t border-gray-700 pt-5"><span class="text-sm text-primary-400">01</span><h3 class="mt-5 font-semibold text-gray-100">Choose</h3><p class="mt-2 text-sm leading-6 text-gray-500">Start from a provided flute or one saved on this device.</p></li>
					<li class="border-t border-gray-700 pt-5"><span class="text-sm text-primary-400">02</span><h3 class="mt-5 font-semibold text-gray-100">Generate</h3><p class="mt-2 text-sm leading-6 text-gray-500">Acoustics and solid geometry are calculated in your browser.</p></li>
					<li class="border-t border-gray-700 pt-5"><span class="text-sm text-primary-400">03</span><h3 class="mt-5 font-semibold text-gray-100">Print</h3><p class="mt-2 text-sm leading-6 text-gray-500">Export STL or STEP files without sending the design anywhere.</p></li>
				</ol>
			</div>
		</section>

		<section class="border-t border-gray-800 bg-primary-950/20">
			<div class="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-5 py-16 sm:px-8 md:flex-row md:items-center">
				<div><h2 class="text-3xl font-semibold tracking-tight text-white">Pick a flute and make it yours.</h2><p class="mt-2 text-gray-400">The library is included. The model is generated locally.</p></div>
				<a href="/build" class="btn-primary min-h-12 shrink-0 px-6">Browse the library <i class="bi bi-arrow-right"></i></a>
			</div>
		</section>
	</main>

	<footer class="relative z-10 border-t border-gray-800 px-5 py-7 text-center text-xs text-gray-600">Print Flute · local by default</footer>
</div>

<style>
	.hero-glow { position: absolute; inset: 0; background: radial-gradient(circle at 75% 35%, rgb(16 185 129 / 0.1), transparent 35%), linear-gradient(to bottom, rgb(3 7 18 / 0.16), rgb(3 7 18 / 0.66)); }
</style>
