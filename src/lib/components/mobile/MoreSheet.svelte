<script lang="ts">
	/**
	 * Overflow + app-actions sheet for the mobile shell. Holds the analysis views
	 * that don't fit the 5-slot bottom bar (Matrix / 3D Explore / Export) and the
	 * chrome that lived in the desktop top bar (examples, save, share, saved
	 * schemes, theme, DSL reference). Self-contained: owns its own action state.
	 */
	import Sheet from './Sheet.svelte';
	import { app } from '$lib/state/app.svelte';
	import { ui, type Tab } from '$lib/state/ui.svelte';
	import { encodeHash } from '$lib/persistence/url-hash';
	import { saveScheme, loadScheme, listSchemes } from '$lib/persistence/local-storage';
	import { examples } from '../../../routes/examples';
	import { base } from '$app/paths';
	import { onMount } from 'svelte';

	let {
		open = false,
		onclose,
		onopendocs
	}: { open?: boolean; onclose: () => void; onopendocs: () => void } = $props();

	const EXAMPLES: Record<string, string> = Object.fromEntries(
		examples.map((e) => [e.name, e.source])
	);
	const exampleNames = examples.map((e) => e.name);
	let currentExample = $state(exampleNames[0]);

	let savedNames = $state<string[]>([]);
	let shareLabel = $state('Share');

	onMount(() => {
		savedNames = listSchemes();
	});

	const VIEWS: { id: Tab; label: string; desc: string }[] = [
		{ id: 'styleguide', label: 'Styleguide', desc: 'Tokens · components' },
		{ id: 'matrix', label: 'Matrix', desc: 'Contrast grid' },
		{ id: 'explore', label: '3D Explore', desc: 'Gamut viewer' },
		{ id: 'export', label: 'Export', desc: 'CSS · tokens · swatch' }
	];

	function pickView(id: Tab) {
		ui.tab = id;
		onclose();
	}
	function pickExample(e: Event) {
		const sel = e.target as HTMLSelectElement;
		currentExample = sel.value;
		app.source = EXAMPLES[sel.value];
		onclose();
	}
	function loadNamed(e: Event) {
		const sel = e.target as HTMLSelectElement;
		const src = loadScheme(sel.value);
		if (src != null) app.source = src;
		sel.value = '';
		onclose();
	}
	function save() {
		const name = prompt('Save scheme as:');
		if (!name) return;
		saveScheme(name, app.source);
		savedNames = listSchemes();
	}
	async function share() {
		location.hash = await encodeHash({ source: app.source });
		navigator.clipboard?.writeText(location.href);
		shareLabel = 'Copied!';
		setTimeout(() => (shareLabel = 'Share'), 1200);
	}
</script>

<Sheet {open} {onclose} title="More">
	<div class="more-group">
		<div class="more-group-title">Views</div>
		{#each VIEWS as v (v.id)}
			<button class="more-row" class:active={ui.tab === v.id} onclick={() => pickView(v.id)}>
				<span class="more-ico">
					{#if v.id === 'styleguide'}
						<svg
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							><rect x="3" y="3" width="18" height="7" rx="1.5" /><rect
								x="3"
								y="14"
								width="10"
								height="7"
								rx="1.5"
							/><circle cx="18" cy="17.5" r="2.5" /></svg
						>
					{:else if v.id === 'matrix'}
						<svg
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							><rect x="3" y="3" width="18" height="18" rx="2" /><path
								d="M3 9h18M3 15h18M9 3v18M15 3v18"
							/></svg
						>
					{:else if v.id === 'explore'}
						<svg
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							><path
								d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"
							/><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></svg
						>
					{:else}
						<svg
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path
								d="M12 15V3"
							/></svg
						>
					{/if}
				</span>
				<span class="more-text">
					<span class="more-label">{v.label}</span>
					<span class="more-desc">{v.desc}</span>
				</span>
				<svg
					class="more-chev"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"><path d="m9 18 6-6-6-6" /></svg
				>
			</button>
		{/each}
	</div>

	<div class="more-group">
		<div class="more-group-title">Scheme</div>
		<label class="more-row as-field">
			<span class="more-ico">
				<svg
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					><rect width="18" height="7" x="3" y="3" rx="1.5" /><rect
						width="9"
						height="7"
						x="3"
						y="14"
						rx="1.5"
					/><rect width="5" height="7" x="16" y="14" rx="1.5" /></svg
				>
			</span>
			<span class="more-label">Example</span>
			<select class="select more-select" value={currentExample} onchange={pickExample}>
				{#each exampleNames as name (name)}<option value={name}>{name}</option>{/each}
			</select>
		</label>

		{#if savedNames.length}
			<label class="more-row as-field">
				<span class="more-ico">
					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						><path
							d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"
						/></svg
					>
				</span>
				<span class="more-label">Saved</span>
				<select class="select more-select" onchange={loadNamed}>
					<option value="">Load…</option>
					{#each savedNames as n (n)}<option value={n}>{n}</option>{/each}
				</select>
			</label>
		{/if}

		<button class="more-row" onclick={save}>
			<span class="more-ico">
				<svg
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><path
						d="M17 21v-8H7v8M7 3v5h8"
					/></svg
				>
			</span>
			<span class="more-label">Save scheme…</span>
		</button>

		<button class="more-row" onclick={share}>
			<span class="more-ico">
				<svg
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><path d="m16 6-4-4-4 4" /><path
						d="M12 2v13"
					/></svg
				>
			</span>
			<span class="more-label">{shareLabel}</span>
		</button>
	</div>

	<div class="more-group">
		<div class="more-group-title">Settings</div>
		<button class="more-row" onclick={() => ui.toggleTheme()}>
			<span class="more-ico">
				{#if ui.theme === 'dark'}
					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						><circle cx="12" cy="12" r="4" /><path
							d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
						/></svg
					>
				{:else}
					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z" /></svg
					>
				{/if}
			</span>
			<span class="more-label">Theme</span>
			<span class="more-trailing">{ui.theme === 'dark' ? 'Dark' : 'Light'}</span>
		</button>

		<button
			class="more-row"
			onclick={() => {
				onclose();
				onopendocs();
			}}
		>
			<span class="more-ico">
				<svg
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"><path d="m16 18 6-6-6-6" /><path d="m8 6-6 6 6 6" /></svg
				>
			</span>
			<span class="more-text">
				<span class="more-label">DSL reference</span>
				<span class="more-desc">Models · methods · functions</span>
			</span>
			<svg
				class="more-chev"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"><path d="m9 18 6-6-6-6" /></svg
			>
		</button>

		<a class="more-row" href="{base}/mixer" onclick={onclose}>
			<span class="more-ico">
				<svg
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					><line x1="4" y1="7" x2="20" y2="7" /><circle cx="9" cy="7" r="2.4" /><line
						x1="4"
						y1="14"
						x2="20"
						y2="14"
					/><circle cx="15" cy="14" r="2.4" /></svg
				>
			</span>
			<span class="more-text">
				<span class="more-label">Mixer</span>
				<span class="more-desc">One color across every model · live sliders</span>
			</span>
			<svg
				class="more-chev"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"><path d="m9 18 6-6-6-6" /></svg
			>
		</a>

		<a class="more-row" href="{base}/models" onclick={onclose}>
			<span class="more-ico">
				<svg
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path
						d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
					/></svg
				>
			</span>
			<span class="more-text">
				<span class="more-label">Color models &amp; systems</span>
				<span class="more-desc">Interactive encyclopedia · 100 spaces</span>
			</span>
			<svg
				class="more-chev"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"><path d="m9 18 6-6-6-6" /></svg
			>
		</a>
	</div>
</Sheet>

<style>
	.more-group {
		margin-bottom: 14px;
	}
	.more-group:last-child {
		margin-bottom: 0;
	}
	.more-group-title {
		font-size: 10.5px;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--text-faint);
		padding: 2px 4px 8px;
	}
	.more-row {
		display: flex;
		align-items: center;
		gap: 12px;
		width: 100%;
		text-align: left;
		padding: 11px 12px;
		min-height: 52px;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: var(--surface);
		color: var(--text);
		cursor: pointer;
		margin-bottom: 8px;
		font-size: 14px;
		text-decoration: none;
	}
	.more-row:last-child {
		margin-bottom: 0;
	}
	.more-row.active {
		border-color: var(--accent);
		color: var(--accent);
		background: var(--accent-soft);
	}
	.more-row.as-field {
		cursor: default;
	}
	.more-ico {
		display: inline-flex;
		flex-shrink: 0;
		color: var(--text-muted);
	}
	.more-row.active .more-ico {
		color: var(--accent);
	}
	.more-ico :global(svg) {
		width: 20px;
		height: 20px;
	}
	.more-text {
		display: flex;
		flex-direction: column;
		gap: 1px;
		min-width: 0;
	}
	.more-label {
		font-weight: 550;
	}
	.more-desc {
		font-size: 11.5px;
		color: var(--text-faint);
	}
	.more-trailing {
		margin-left: auto;
		font-size: 12.5px;
		color: var(--text-muted);
	}
	.more-chev {
		width: 18px;
		height: 18px;
		margin-left: auto;
		color: var(--text-faint);
		flex-shrink: 0;
	}
	.more-select {
		margin-left: auto;
		max-width: 58%;
		font-size: 13px;
	}
</style>
