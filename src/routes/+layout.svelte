<script lang="ts">
	import './layout.css';
	import { onMount } from 'svelte';
	import { ui, type Tab } from '$lib/state/ui.svelte';

	let { children } = $props();
	let ready = $state(false);

	onMount(() => {
		const applied = document.documentElement.getAttribute('data-theme');
		if (applied === 'dark' || applied === 'light') ui.theme = applied;
		try {
			const raw = localStorage.getItem('chromatics:ui');
			if (raw) {
				const p = JSON.parse(raw);
				if (typeof p.editorWidth === 'number') ui.editorWidth = p.editorWidth;
				if (typeof p.editorCollapsed === 'boolean') ui.editorCollapsed = p.editorCollapsed;
				if (p.tab) ui.tab = p.tab as Tab;
			}
		} catch {
			/* ignore */
		}
		ready = true;
	});

	$effect(() => {
		if (!ready) return;
		document.documentElement.setAttribute('data-theme', ui.theme);
		try {
			localStorage.setItem('chromatics:theme', ui.theme);
		} catch {
			/* ignore */
		}
	});

	$effect(() => {
		if (!ready) return;
		try {
			localStorage.setItem(
				'chromatics:ui',
				JSON.stringify({
					editorWidth: ui.editorWidth,
					editorCollapsed: ui.editorCollapsed,
					tab: ui.tab
				})
			);
		} catch {
			/* ignore */
		}
	});
</script>

{@render children()}
