<script lang="ts">
	import favicon from '$lib/assets/favicon.png';
	import '../app.css';
	import 'bootstrap-icons/font/bootstrap-icons.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="dark">
	{@render children()}
</div>
