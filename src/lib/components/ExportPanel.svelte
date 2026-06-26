<script lang="ts">
	import { app } from '$lib/state/app.svelte';
	import { exportScheme, EXPORT_FORMATS, type ExportFormat } from '$lib/export';

	let format = $state<ExportFormat>('css');
	const output = $derived(exportScheme(app.scheme, format));
	let copied = $state(false);

	function copy() {
		navigator.clipboard.writeText(output);
		copied = true;
		setTimeout(() => (copied = false), 1200);
	}
</script>

<div class="export-root">
	<div class="ex-toolbar">
		{#each EXPORT_FORMATS as f (f.id)}
			<button
				class="ex-tab {format === f.id ? 'ex-active' : ''}"
				onclick={() => (format = f.id)}>{f.label}</button
			>
		{/each}
		<button class="ex-copy" onclick={copy} disabled={!app.scheme.entries.length}>
			{copied ? 'Copied!' : 'Copy'}
		</button>
	</div>
	{#if app.scheme.entries.length === 0}
		<div class="ex-empty">Define some colors to export.</div>
	{:else}
		<pre class="ex-output">{output}</pre>
	{/if}
</div>

<style>
	.export-root {
		display: flex;
		flex-direction: column;
		height: 100%;
		min-height: 0;
		background: #0e0e10;
	}
	.ex-toolbar {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 8px 12px;
		border-bottom: 1px solid #2a2a30;
		flex-shrink: 0;
		flex-wrap: wrap;
	}
	.ex-tab {
		padding: 3px 9px;
		border: 1px solid transparent;
		border-radius: 4px;
		background: none;
		color: #8888a0;
		font-size: 12px;
		cursor: pointer;
	}
	.ex-tab:hover {
		color: #c8c8d0;
	}
	.ex-active {
		background: #2a2a30;
		color: #e4e4e8;
	}
	.ex-copy {
		margin-left: auto;
		padding: 3px 10px;
		border: 1px solid #2a2a30;
		border-radius: 4px;
		background: none;
		color: #ddd;
		font-size: 12px;
		cursor: pointer;
	}
	.ex-copy:hover:not(:disabled) {
		border-color: #555;
	}
	.ex-copy:disabled {
		opacity: 0.4;
		cursor: default;
	}
	.ex-empty {
		padding: 32px;
		color: #555;
		font-size: 13px;
	}
	.ex-output {
		flex: 1;
		min-height: 0;
		overflow: auto;
		margin: 0;
		padding: 14px 16px;
		font-family: ui-monospace, Menlo, monospace;
		font-size: 12px;
		line-height: 1.6;
		color: #c8c8d0;
		white-space: pre;
	}
</style>
