<script lang="ts">
	import type { Scheme, SchemeEntry } from '$lib/scheme/types';
	import { getModel, getModelByMode, type ColorValue } from '$lib/models';
	import type { DSLValue } from '$lib/dsl/evaluator.js';
	import { nearestName } from '$lib/color-names';
	import { isPreview } from '$lib/dsl/preview';
	import PreviewCard from './preview-cards/PreviewCard.svelte';

	let { scheme }: { scheme: Scheme } = $props();

	const previews = $derived(scheme.nonColorVars.filter((v) => isPreview(v.value)));
	const plainVars = $derived(scheme.nonColorVars.filter((v) => !isPreview(v.value)));

	const r2 = (n: number, d: number) => Math.round(n * d) / d;
	function fmtOklch(c: ColorValue) {
		return `oklch(${r2(c.channel('ok_l'), 1000)} ${r2(c.channel('ok_c'), 10000)} ${r2(c.channel('ok_h'), 100)})`;
	}
	function fmtRgb(c: ColorValue) {
		return `rgb(${Math.round(c.channel('r') * 255)} ${Math.round(c.channel('g') * 255)} ${Math.round(c.channel('b') * 255)})`;
	}
	function fmtHsl(c: ColorValue) {
		return `hsl(${Math.round(c.channel('h'))} ${Math.round(c.channel('s') * 100)}% ${Math.round(c.channel('l') * 100)}%)`;
	}
	function fmtVal(v: DSLValue): string {
		if (typeof v === 'number') return String(r2(v, 10000));
		if (Array.isArray(v)) return `[${v.length} items]`;
		return String(v);
	}

	let copied = $state<string | null>(null);
	function copy(text: string) {
		navigator.clipboard?.writeText(text);
		copied = text;
		setTimeout(() => {
			if (copied === text) copied = null;
		}, 900);
	}
	// The four most-common readouts, always shown for reference.
	const COMMON_KEY: Record<string, string> = { oklch: 'OKLCH', rgb: 'RGB', hsl: 'HSL' };
	/** Which common row (if any) IS the variable's own model. */
	function commonNativeKey(e: SchemeEntry): string | null {
		if (e.model === 'hex') return 'HEX';
		return COMMON_KEY[e.color.model] ?? null;
	}
	const rNum = (v: number) => String(Math.round(v * 1000) / 1000);
	/** The variable's OWN model rendered from its native channels (e.g. HWB, LAB). */
	function fmtNative(c: ColorValue): { k: string; v: string } | null {
		const def = getModel(c.model) ?? getModelByMode(c.model);
		if (!def || !def.channels.length) return null;
		const proj = c.project(def.mode) as unknown as Record<string, number | undefined>;
		const vals = def.channels.map((ch) => rNum((proj[ch.culoriField] ?? 0) * (ch.scale ?? 1)));
		return { k: def.id.toUpperCase(), v: `${def.id}(${vals.join(' ')})` };
	}
	/**
	 * Rows for a color: the four common readouts, plus — when the variable's own
	 * model isn't one of them — its native model on top. The native row is flagged
	 * so it renders emphasised (the value the color actually IS).
	 */
	function rowsFor(e: SchemeEntry): { k: string; v: string; native: boolean }[] {
		const c = e.color;
		const base = [
			{ k: 'HEX', v: c.hex },
			{ k: 'OKLCH', v: fmtOklch(c) },
			{ k: 'RGB', v: fmtRgb(c) },
			{ k: 'HSL', v: fmtHsl(c) }
		];
		const nk = commonNativeKey(e);
		if (nk) return base.map((r) => ({ ...r, native: r.k === nk }));
		const nat = fmtNative(c);
		const rows = base.map((r) => ({ ...r, native: false }));
		return nat ? [{ ...nat, native: true }, ...rows] : rows;
	}
</script>

<div class="insp scroll">
	{#if scheme.entries.length > 0}
		<div class="palette">
			{#each scheme.entries as e (e.name)}
				<button
					class="pal"
					style="background: {e.color.toCSS()}"
					title="{e.name} · {e.color.hex}"
					onclick={() => copy(e.color.hex)}
					aria-label="copy {e.name}"
				></button>
			{/each}
		</div>

		<div class="grid">
			{#each scheme.entries as e (e.name)}
				<div class="row">
					<button
						class="sw"
						style="background: {e.color.toCSS()}"
						onclick={() => copy(e.color.hex)}
						title="copy hex"
					>
						{#if copied === e.color.hex}<span class="sw-copied">copied</span>{/if}
					</button>
					<div class="meta">
						<div class="line1">
							<span class="name">{e.name}</span>
							<span class="chip">{e.model}</span>
							<span class="chip chip-name" title="nearest CSS color"
								>≈ {nearestName(e.color).name}</span
							>
							{#if !e.color.inGamut}
								<span class="badge badge-warn">out of gamut</span>
							{:else if e.color.inP3}
								<span class="badge badge-p3">P3</span>
							{/if}
						</div>
						<div class="convs">
							{#each rowsFor(e) as row (row.k)}
								<button
									class="conv"
									class:is-native={row.native}
									onclick={() => copy(row.v)}
									title={row.native ? `${row.k} — this color's model` : `copy ${row.k}`}
								>
									<span class="conv-k">{row.k}</span>
									<span class="conv-v mono">{copied === row.v ? 'copied!' : row.v}</span>
								</button>
							{/each}
						</div>
						{#if e.deps.length > 0}
							<div class="deps">
								<span class="deps-label">derives from</span>
								{#each e.deps as d (d)}<span class="dep">{d}</span>{/each}
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="empty">
			<div class="empty-title">No colors yet</div>
			<div class="empty-sub">Define some colors in the editor to inspect them here.</div>
		</div>
	{/if}

	{#if previews.length > 0}
		<div class="previews">
			<div class="sec">Previews</div>
			<div class="preview-stack">
				{#each previews as v (v.name)}
					<PreviewCard data={v.value} name={v.name} />
				{/each}
			</div>
		</div>
	{/if}

	{#if plainVars.length > 0}
		<div class="values">
			<div class="sec">Values</div>
			<div class="val-grid">
				{#each plainVars as v (v.name)}
					<div class="val-row">
						<span class="name">{v.name}</span>
						<span class="val mono">{fmtVal(v.value)}</span>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.insp {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		padding: 14px;
	}
	.palette {
		display: flex;
		height: 44px;
		border-radius: var(--radius-sm);
		overflow: hidden;
		border: 1px solid var(--border);
		box-shadow: var(--shadow-sm);
		margin-bottom: 14px;
	}
	.pal {
		flex: 1;
		min-width: 0;
		border: none;
		padding: 0;
		cursor: pointer;
		transition: flex 0.15s;
	}
	.pal:hover {
		flex: 1.6;
	}
	.grid {
		display: grid;
		gap: 8px;
	}
	.row {
		display: flex;
		gap: 12px;
		padding: 9px;
		border-radius: var(--radius);
		border: 1px solid var(--border);
		background: var(--surface);
		box-shadow: var(--shadow-sm);
		transition: border-color 0.12s;
	}
	.row:hover {
		border-color: var(--border-strong);
	}
	.sw {
		position: relative;
		width: 64px;
		flex-shrink: 0;
		align-self: stretch;
		min-height: 60px;
		border-radius: var(--radius-sm);
		border: 1px solid color-mix(in srgb, var(--text) 12%, transparent);
		cursor: pointer;
		padding: 0;
	}
	.sw-copied {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 10px;
		font-weight: 700;
		color: #fff;
		mix-blend-mode: difference;
	}
	.meta {
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 6px;
		min-width: 0;
		flex: 1;
	}
	.line1 {
		display: flex;
		align-items: center;
		gap: 7px;
		flex-wrap: wrap;
	}
	.name {
		font-weight: 600;
		font-size: 13.5px;
	}
	.badge {
		font-size: 10px;
		font-weight: 600;
		padding: 1px 7px;
		border-radius: 99px;
	}
	.badge-warn {
		background: color-mix(in srgb, var(--warn) 18%, transparent);
		color: var(--warn);
	}
	.badge-p3 {
		background: color-mix(in srgb, var(--accent) 18%, transparent);
		color: var(--accent);
	}
	.chip-name {
		color: var(--text-faint);
		font-weight: 500;
	}
	.convs {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 3px;
	}
	.conv {
		display: flex;
		align-items: baseline;
		gap: 6px;
		padding: 3px 7px;
		border: none;
		border-radius: var(--radius-xs);
		background: var(--surface-2);
		cursor: pointer;
		text-align: left;
		min-width: 0;
		transition: background 0.12s;
	}
	.conv:hover {
		background: var(--surface-3);
	}
	/* The variable's OWN model — emphasised so its real value is unmistakable. */
	.conv.is-native {
		background: var(--accent-soft);
		outline: 1px solid var(--accent);
		grid-column: 1 / -1;
	}
	.conv.is-native .conv-k {
		color: var(--accent);
	}
	.conv.is-native .conv-v {
		color: var(--text);
		font-weight: 600;
	}
	.conv-k {
		font-size: 9px;
		font-weight: 700;
		letter-spacing: 0.04em;
		color: var(--text-faint);
		width: 34px;
		flex-shrink: 0;
	}
	.conv-v {
		font-size: 11px;
		color: var(--text-muted);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.deps {
		display: flex;
		align-items: center;
		gap: 5px;
		flex-wrap: wrap;
	}
	.deps-label {
		font-size: 10.5px;
		color: var(--text-faint);
	}
	.dep {
		padding: 0 7px;
		border-radius: 99px;
		background: var(--accent-soft);
		color: var(--accent);
		font-size: 10.5px;
		font-weight: 600;
	}
	.empty {
		padding: 40px 16px;
		text-align: center;
	}
	.empty-title {
		font-size: 14px;
		font-weight: 600;
		color: var(--text-muted);
	}
	.empty-sub {
		font-size: 12.5px;
		color: var(--text-faint);
		margin-top: 4px;
	}
	.previews {
		margin-top: 18px;
	}
	.preview-stack {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.values {
		margin-top: 18px;
	}
	.sec {
		font-size: 10.5px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--text-faint);
		margin-bottom: 8px;
	}
	.val-grid {
		display: grid;
		gap: 4px;
	}
	.val-row {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 6px 11px;
		border-radius: var(--radius-sm);
		background: var(--surface-2);
	}
	.val {
		font-size: 12px;
		color: var(--text-muted);
		margin-left: auto;
	}

	@media (max-width: 520px) {
		.convs {
			grid-template-columns: 1fr;
		}
		.conv-v {
			white-space: normal;
		}
	}
</style>
