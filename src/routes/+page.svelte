<script lang="ts">
	import favicon from '$lib/assets/favicon.png';
	import LandingBackdrop from '$lib/components/landing/LandingBackdrop.svelte';
	import LandingPreview3D from '$lib/components/landing/LandingPreview3D.svelte';
	import PrintFluteAnimation from '$lib/components/landing/PrintFluteAnimation.svelte';
	import { PARAMETER_BOUNDS } from '$lib/validation/designParameters';

	let boreDiameter = $state(14.3);
	let wallThickness = $state(2.5);
	let holeCount = $state(6);

	const capabilities = [
		{
			icon: 'bi-pencil-fill',
			title: 'Acoustic designer',
			body: 'Set bore, wall, embouchure, and tone-hole tuning. Lengths and hole seats update as you edit.'
		},
		{
			icon: 'bi-box',
			title: '3D model generation',
			body: 'The designer builds a flute solid you can inspect, section, and export. This page only previews that model.'
		},
		{
			icon: 'bi-file-earmark-arrow-down',
			title: 'STL and STEP export',
			body: 'When the geometry is ready, export printable files from the builder. Generation stays on this machine.'
		},
		{
			icon: 'bi-collection-fill',
			title: 'Local library',
			body: 'Save, load, and import presets on this device. Nothing is uploaded to store or compare your designs.'
		},
		{
			icon: 'bi-music-note',
			title: 'Chromatic tuner',
			body: 'After you print, check the instrument against the predicted scale with cent-accurate pitch detection.'
		},
		{
			icon: 'bi-soundwave',
			title: 'Timbre analysis',
			body: 'Inspect brightness, breathiness, harmonics, and a spectrogram from microphone audio in this tab.'
		}
	];

	const steps = [
		{ n: 1, title: 'Main geometry', body: 'Dial in bore, wall thickness, cork, and embouchure.' },
		{ n: 2, title: 'Place tone holes', body: 'Choose a scale. Distances calculate from those inputs.' },
		{ n: 3, title: 'Prepare the solid', body: 'Add cuts and connectors, then export the generated model.' }
	];
</script>

<svelte:head>
	<title>Print Flute — Generate 3D flute models in the browser</title>
	<meta
		name="description"
		content="Generate 3D-printable flute models entirely on your device. No cloud, no account, no uploads."
	/>
</svelte:head>

<div class="relative min-h-screen bg-gray-950">
	<LandingBackdrop />

	<div class="relative">
		<header class="border-b border-gray-800 bg-gray-900/95">
			<div class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
				<div class="flex items-center gap-3">
					<img src={favicon} alt="Print Flute logo" class="h-10 w-auto" />
					<div>
						<h1 class="text-xl font-bold text-primary-400">Print Flute</h1>
						<p class="text-xs text-gray-400">Design &amp; Analysis for 3D Printed Flutes</p>
					</div>
				</div>
				<div class="flex items-center gap-3">
					<span class="badge-success hidden sm:inline-flex items-center gap-1">
						<i class="bi bi-shield-lock"></i>
						100% local · no cloud
					</span>
					<a href="/build" class="btn-primary">
						Open designer
						<i class="bi bi-arrow-right"></i>
					</a>
				</div>
			</div>
		</header>

		<main class="mx-auto max-w-6xl space-y-16 px-4 py-10 sm:px-6 md:py-14">
			<section class="grid items-center gap-10 lg:grid-cols-2">
				<div class="space-y-6">
					<p class="heading-section">Local 3D model generation</p>
					<h2 class="text-4xl font-semibold tracking-tight text-gray-100 sm:text-5xl">
						Generate the flute
						<span class="text-primary-400">before you print</span>
					</h2>
					<p class="text-lg text-gray-300">
						Print Flute calculates acoustics and builds a 3D model in your browser. There is no
						account, no upload, and no cloud service in the path from parameters to geometry.
					</p>
					<div class="flex flex-wrap gap-2">
						<span class="stat-cell text-xs text-gray-300">
							<i class="bi bi-wifi-off text-primary-400"></i>
							No cloud
						</span>
						<span class="stat-cell text-xs text-gray-300">
							<i class="bi bi-cpu text-primary-400"></i>
							On-device generation
						</span>
						<span class="stat-cell text-xs text-gray-300">
							<i class="bi bi-lock text-primary-400"></i>
							Designs stay here
						</span>
					</div>
					<div class="flex flex-wrap gap-3">
						<a href="/build" class="btn-primary">
							Start designing
							<i class="bi bi-pencil-fill"></i>
						</a>
						<a href="#model" class="btn-secondary">Adjust the model</a>
					</div>
				</div>

				<div class="canvas-panel h-64 overflow-hidden sm:h-72">
					<PrintFluteAnimation />
				</div>
			</section>

			<section id="model" class="space-y-4">
				<div class="flex-between">
					<div>
						<p class="heading-section">Interactive model</p>
						<h3 class="heading-page mt-1">Parameters drive the generated solid</h3>
					</div>
					<p class="text-muted hidden sm:block">Three.js preview · no CAD export on this page</p>
				</div>
				<div class="canvas-panel h-[26rem] overflow-hidden">
					<LandingPreview3D
						{boreDiameter}
						{wallThickness}
						holeCount={Math.round(holeCount)}
					/>
				</div>
				<div class="card grid gap-4 md:grid-cols-3">
					<label class="space-y-2">
						<div class="flex-between">
							<span class="label">Bore diameter</span>
							<span class="text-muted">{boreDiameter.toFixed(1)} mm</span>
						</div>
						<input
							class="input-slider w-full"
							type="range"
							min={PARAMETER_BOUNDS.boreDiameter.min}
							max={PARAMETER_BOUNDS.boreDiameter.max}
							step="0.1"
							bind:value={boreDiameter}
						/>
					</label>
					<label class="space-y-2">
						<div class="flex-between">
							<span class="label">Wall thickness</span>
							<span class="text-muted">{wallThickness.toFixed(1)} mm</span>
						</div>
						<input
							class="input-slider w-full"
							type="range"
							min={PARAMETER_BOUNDS.wallThickness.min}
							max={PARAMETER_BOUNDS.wallThickness.max}
							step="0.1"
							bind:value={wallThickness}
						/>
					</label>
					<label class="space-y-2">
						<div class="flex-between">
							<span class="label">Tone holes</span>
							<span class="text-muted">{Math.round(holeCount)}</span>
						</div>
						<input
							class="input-slider w-full"
							type="range"
							min={PARAMETER_BOUNDS.numberOfToneHoles.min}
							max={PARAMETER_BOUNDS.numberOfToneHoles.max}
							step="1"
							bind:value={holeCount}
						/>
					</label>
				</div>
			</section>

			<section class="space-y-6">
				<div>
					<p class="heading-section">What you can do</p>
					<h3 class="heading-page mt-2">A designer, still on-device</h3>
				</div>
				<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
					{#each capabilities as capability}
						<article class="card space-y-3">
							<div class="flex-center">
								<i class="bi {capability.icon} text-primary-400 text-lg"></i>
								<h4 class="font-semibold text-gray-100">{capability.title}</h4>
							</div>
							<p class="text-muted">{capability.body}</p>
						</article>
					{/each}
				</div>
			</section>

			<section class="grid gap-8 lg:grid-cols-2">
				<div class="space-y-4">
					<p class="heading-section">How a model is built</p>
					<h3 class="heading-page">Three steps to a solid</h3>
					<p class="text-gray-300">
						The builder walks geometry, tone holes, then print prep. Heavy solid export stays in that
						flow; this page only generates a live preview.
					</p>
					<div class="space-y-2">
						{#each steps as step}
							<div class="flex items-start gap-3 rounded bg-gray-800/50 p-3">
								<span class="badge-auto mt-0.5">{step.n}</span>
								<div>
									<div class="text-sm text-gray-200">{step.title}</div>
									<div class="text-xs text-gray-400">{step.body}</div>
								</div>
							</div>
						{/each}
					</div>
				</div>

				<div class="card space-y-4">
					<div class="flex-center">
						<i class="bi bi-cloud-slash text-secondary-400 text-xl"></i>
						<h3 class="heading-analysis">100% local. No cloud.</h3>
					</div>
					<p class="text-gray-300">
						Acoustics, library files, tuner audio, and model export execute in this browser. There is
						no backend that receives your flute and no sign-in required to generate geometry.
					</p>
					<ul class="space-y-2 text-sm text-gray-300">
						<li class="flex-center"><i class="bi bi-check text-primary-400"></i> Parameters persist in local storage</li>
						<li class="flex-center"><i class="bi bi-check text-primary-400"></i> Presets import and export as JSON on disk</li>
						<li class="flex-center"><i class="bi bi-check text-primary-400"></i> Models are generated on this machine</li>
						<li class="flex-center"><i class="bi bi-check text-primary-400"></i> Microphone analysis never leaves the tab</li>
					</ul>
				</div>
			</section>

			<section class="card flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
				<div>
					<h3 class="heading-page">Open the full generator</h3>
					<p class="text-muted mt-1">Same dark workshop, with every design step and export.</p>
				</div>
				<a href="/build" class="btn-primary">
					Go to builder
					<i class="bi bi-arrow-right"></i>
				</a>
			</section>
		</main>

		<footer class="border-t border-gray-800 px-4 py-6 text-center text-xs text-gray-500">
			Print Flute v0.1.0 · runs entirely in your browser
		</footer>
	</div>
</div>
