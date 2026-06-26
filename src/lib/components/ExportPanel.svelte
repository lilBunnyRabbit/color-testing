<script lang="ts">
	import { app } from '$lib/state/app.svelte';
	import { exportScheme, EXPORT_FORMATS, type ExportFormat } from '$lib/export';

	let format = $state<ExportFormat>('css');
	const output = $derived(exportScheme(app.scheme, format));
	let copied = $state(false);

	const HINTS: Record<ExportFormat, string> = {
		css: ':root custom properties — drop into any stylesheet.',
		tokens: 'W3C Design Token (DTCG) JSON for Figma / Style Dictionary.',
		tailwind: 'Tailwind v4 @theme block + a legacy config colors object.',
		markdown: 'A documentation table — name · hex · oklch · comment.'
	};

	function copy() {
		navigator.clipboard.writeText(output);
		copied = true;
		setTimeout(() => (copied = false), 1200);
	}
</script>

<div class="export-root">
	<div class="ex-bar">
		<div class="seg">
			{#each EXPORT_FORMATS as f (f.id)}
				<button class="seg-item {format === f.id ? 'active' : ''}" onclick={() => (format = f.id)}>
					{f.label}
				</button>
			{/each}
		</div>
	</div>

	{#if app.scheme.entries.length === 0}
		<div class="ex-empty">Define some colors to export.</div>
	{:else}
		<div class="ex-hint">{HINTS[format]}</div>
		<div class="ex-card">
			<button class="ex-copy" onclick={copy}>
				{#if copied}
					<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
					Copied
				{:else}
					<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
					Copy
				{/if}
			</button>
			<pre class="ex-output mono scroll">{output}</pre>
		</div>
	{/if}
</div>

<style>
	.export-root {
		display: flex;
		flex-direction: column;
		height: 100%;
		min-height: 0;
		padding: 14px;
		gap: 12px;
		background: var(--bg);
	}
	.ex-bar {
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}
	.ex-hint {
		font-size: 12px;
		color: var(--text-faint);
		flex-shrink: 0;
	}
	.ex-card {
		position: relative;
		flex: 1;
		min-height: 0;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
		box-shadow: var(--shadow-sm);
		overflow: hidden;
	}
	.ex-copy {
		position: absolute;
		top: 10px;
		right: 10px;
		z-index: 2;
		display: inline-flex;
		align-items: center;
		gap: 5px;
		padding: 5px 11px;
		border-radius: var(--radius-xs);
		border: 1px solid var(--border);
		background: var(--surface);
		color: var(--text);
		font-size: 12px;
		font-weight: 500;
		cursor: pointer;
		box-shadow: var(--shadow-sm);
		transition:
			border-color 0.12s,
			color 0.12s;
	}
	.ex-copy:hover {
		border-color: var(--border-strong);
	}
	.ex-output {
		height: 100%;
		overflow: auto;
		margin: 0;
		padding: 16px 18px;
		font-size: 12px;
		line-height: 1.65;
		color: var(--text);
		white-space: pre;
	}
	.ex-empty {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--text-faint);
		font-size: 13px;
	}
</style>
