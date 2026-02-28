<script lang="ts" context="module">
	export interface WelcomePage {
		id: string;
		title: string;
		component: ConstructorOfATypedSvelteComponent;
	}
</script>

<script lang="ts">
	export let pages: WelcomePage[] = [];
	export let open = false;
	export let onComplete: () => void = () => {};

	let currentPageIndex = 0;
	let dialogElement: HTMLDialogElement;

	$: currentPage = pages[currentPageIndex];
	$: isFirstPage = currentPageIndex === 0;
	$: isLastPage = currentPageIndex === pages.length - 1;
	$: progress = pages.length > 1 ? ((currentPageIndex + 1) / pages.length) * 100 : 100;

	$: if (dialogElement) {
		if (open) {
			dialogElement.showModal();
		} else {
			dialogElement.close();
		}
	}

	function nextPage() {
		if (isLastPage) {
			complete();
		} else {
			currentPageIndex = Math.min(currentPageIndex + 1, pages.length - 1);
		}
	}

	function prevPage() {
		currentPageIndex = Math.max(currentPageIndex - 1, 0);
	}

	function goToPage(index: number) {
		if (index >= 0 && index < pages.length) {
			currentPageIndex = index;
		}
	}

	function complete() {
		currentPageIndex = 0;
		onComplete();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (!open) return;
		if (event.key === 'ArrowRight') nextPage();
		if (event.key === 'ArrowLeft') prevPage();
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions -->
<dialog
	bind:this={dialogElement}
	class="modal-dialog"
	style="max-width: 40rem"
>
	<div class="modal-content">
		<header class="modal-header">
			<div class="flex items-center gap-3">
				<h2 class="modal-title">{currentPage?.title ?? ''}</h2>
				<span class="text-xs text-gray-500">{currentPageIndex + 1} / {pages.length}</span>
			</div>
			<button
				class="btn-icon text-neutral-400 hover:text-white hover:bg-white/10"
				on:click={complete}
				aria-label="Skip welcome"
			>
				<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
					<path
						d="M15 5L5 15M5 5L15 15"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
					/>
				</svg>
			</button>
		</header>

		<div class="modal-body min-h-64">
			{#each pages as page, i (page.id)}
				{#if i === currentPageIndex}
					<svelte:component this={page.component} />
				{/if}
			{/each}
		</div>

		<footer class="modal-footer">
			<div class="flex items-center w-full">
				<div class="flex gap-1.5">
					{#each pages as _, i}
						<button
							class="w-2 h-2 rounded-full transition-colors duration-200 {i === currentPageIndex
								? 'bg-primary-500'
								: i < currentPageIndex
									? 'bg-primary-500/40'
									: 'bg-gray-600'}"
							on:click={() => goToPage(i)}
							aria-label="Go to page {i + 1}"
					></button>
					{/each}
				</div>
				<div class="ml-auto flex gap-2">
					{#if !isFirstPage}
						<button class="btn-secondary btn-sm" on:click={prevPage}>
							Back
						</button>
					{/if}
					<button class="btn-primary btn-sm" on:click={nextPage}>
						{isLastPage ? 'Get Started' : 'Next'}
					</button>
				</div>
			</div>
		</footer>
	</div>
</dialog>
