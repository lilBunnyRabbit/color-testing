<script lang="ts">
	import { app } from '$lib/state/app.svelte';
	import { exportScheme, toSwatchSVG, EXPORT_FORMATS, type ExportFormat } from '$lib/export';

	let format = $state<ExportFormat>('css');
	let swatchBg = $state('#fbfcfd');
	const swatchBgOptions = $derived([
		{ label: 'Light', value: '#fbfcfd' },
		{ label: 'White', value: '#ffffff' },
		{ label: 'Black', value: '#0b0b0c' },
		...app.scheme.entries.map((e) => ({ label: e.name, value: e.color.hex }))
	]);
	const output = $derived(
		format === 'swatch'
			? toSwatchSVG(app.scheme, { background: swatchBg })
			: exportScheme(app.scheme, format)
	);
	let copied = $state(false);

	const HINTS: Record<ExportFormat, string> = {
		css: ':root custom properties — drop into any stylesheet.',
		tokens: 'W3C Design Token (DTCG) JSON for Figma / Style Dictionary.',
		tailwind: 'Tailwind v4 @theme block + a legacy config colors object.',
		markdown: 'A documentation table — name · hex · oklch · comment.',
		swatch: 'A shareable swatch sheet — preview below, download as SVG or PNG.'
	};

	function copy() {
		navigator.clipboard.writeText(output);
		copied = true;
		setTimeout(() => (copied = false), 1200);
	}

	function download(filename: string, blob: Blob) {
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		a.click();
		URL.revokeObjectURL(url);
	}
	function downloadSvg() {
		download('palette.svg', new Blob([output], { type: 'image/svg+xml' }));
	}
	function downloadPng() {
		const blob = new Blob([output], { type: 'image/svg+xml' });
		const url = URL.createObjectURL(blob);
		const img = new Image();
		img.onload = () => {
			const scale = 2;
			const c = document.createElement('canvas');
			c.width = (img.naturalWidth || img.width) * scale;
			c.height = (img.naturalHeight || img.height) * scale;
			const ctx = c.getContext('2d');
			if (ctx) {
				ctx.scale(scale, scale);
				ctx.drawImage(img, 0, 0);
				c.toBlob((b) => {
					if (b) download('palette.png', b);
				});
			}
			URL.revokeObjectURL(url);
		};
		img.src = url;
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
		<div class="ex-hint">
			{HINTS[format]}
			{#if format === 'swatch'}
				<span class="ex-actions">
					<label class="ex-bg-field">
						<span>Background</span>
						<select class="select" bind:value={swatchBg}>
							{#each swatchBgOptions as o (o.value + o.label)}<option value={o.value}>{o.label}</option>{/each}
						</select>
					</label>
					<button class="btn" onclick={downloadSvg}>Download SVG</button>
					<button class="btn" onclick={downloadPng}>Download PNG</button>
				</span>
			{/if}
		</div>
		{#if format === 'swatch'}
			<div class="ex-card ex-swatch scroll">
				<!-- eslint-disable-next-line svelte/no-at-html-tags -->
				<div class="ex-svg">{@html output}</div>
			</div>
		{:else}
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
		display: flex;
		align-items: center;
		gap: 12px;
		font-size: 12px;
		color: var(--text-faint);
		flex-shrink: 0;
	}
	.ex-actions {
		margin-left: auto;
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.ex-bg-field {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 11px;
		color: var(--text-muted);
	}
	.ex-swatch {
		overflow: auto;
		padding: 16px;
		display: flex;
		justify-content: center;
		align-items: flex-start;
	}
	.ex-svg :global(svg) {
		max-width: 100%;
		height: auto;
		border-radius: var(--radius-sm);
		box-shadow: var(--shadow-sm);
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

	@media (max-width: 640px) {
		.ex-bar {
			overflow-x: auto;
			scrollbar-width: none;
			-ms-overflow-style: none;
		}
		.ex-bar::-webkit-scrollbar {
			display: none;
		}
		.ex-bar .seg {
			flex-wrap: nowrap;
		}
		.ex-hint {
			flex-direction: column;
			align-items: stretch;
		}
		.ex-actions {
			margin-left: 0;
			flex-wrap: wrap;
		}
		.ex-actions .ex-bg-field,
		.ex-actions .select,
		.ex-actions .btn {
			flex: 1 1 auto;
			min-height: 40px;
		}
		.ex-output {
			padding-top: 36px;
		}
	}
</style>
