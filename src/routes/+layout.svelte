<script lang="ts">
	import favicon from '$lib/assets/favicon.png';
	import { pwaInfo } from 'virtual:pwa-info';
	import '../app.css';
	import 'bootstrap-icons/font/bootstrap-icons.css';

	let { children } = $props();

	const webManifest = $derived(pwaInfo ? pwaInfo.webManifest.linkTag : '');
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	{@html webManifest}
</svelte:head>

<div class="dark">
	{@render children()}
</div>
