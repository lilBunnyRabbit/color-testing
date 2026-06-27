<script lang="ts">
	import DesktopShell from '$lib/components/DesktopShell.svelte';
	import MobileShell from '$lib/components/mobile/MobileShell.svelte';
	import { app } from '$lib/state/app.svelte';
	import { ui } from '$lib/state/ui.svelte';
	import { decodeHash } from '$lib/persistence/url-hash';
	import { saveLast, loadLast } from '$lib/persistence/local-storage';
	import { examples } from './examples';
	import { onMount } from 'svelte';

	// Seed an example so the app has live data on first paint (both shells).
	if (app.source === '') app.source = examples[0].source;

	onMount(() => {
		decodeHash(location.hash).then((fromHash) => {
			if (fromHash) app.source = fromHash.source;
			else {
				const last = loadLast();
				if (last) app.source = last;
			}
		});
	});

	$effect(() => {
		saveLast(app.source);
	});
</script>

<svelte:head><title>Chromatics</title></svelte:head>

<!--
	Mount-gated shell chooser. During SSR/prerender and the first client
	(hydration) render, ui.mounted is false → DesktopShell, so the prerendered
	markup and the first client render match exactly (no hydration mismatch).
	+layout.svelte flips ui.mounted / ui.isMobile in onMount via matchMedia.
-->
{#if !ui.mounted || !ui.isMobile}
	<DesktopShell />
{:else}
	<MobileShell />
{/if}
