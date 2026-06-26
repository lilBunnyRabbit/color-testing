<script lang="ts">
	import type { Scheme } from '$lib/scheme/types';
	import type { ColorValue } from '$lib/models';
	import type { DSLValue } from '$lib/dsl/evaluator.js';

	let { scheme }: { scheme: Scheme } = $props();

	function fmtOklch(c: ColorValue): string {
		const l = Math.round(c.channel('ok_l') * 1000) / 1000;
		const ch = Math.round(c.channel('ok_c') * 10000) / 10000;
		const h = Math.round(c.channel('ok_h') * 100) / 100;
		return `oklch(${l} ${ch} ${h})`;
	}
	function fmtVal(v: DSLValue): string {
		if (typeof v === 'number') return String(Math.round(v * 10000) / 10000);
		if (Array.isArray(v)) return `[${v.length} items]`;
		return String(v);
	}
</script>

<div class="insp scroll">
	{#if scheme.entries.length > 0}
		<div class="grid">
			{#each scheme.entries as e (e.name)}
				<div class="row">
					<div class="sw" style="background: {e.color.toCSS()}">
						<span class="sw-hex mono">{e.color.hex}</span>
					</div>
					<div class="meta">
						<div class="line1">
							<span class="name">{e.name}</span>
							<span class="chip">{e.model}</span>
							{#if !e.color.inGamut}
								<span class="badge badge-warn">out of gamut</span>
							{:else if e.color.inP3}
								<span class="badge badge-p3">P3</span>
							{/if}
						</div>
						<div class="coord mono">{fmtOklch(e.color)}</div>
						{#if e.deps.length > 0}
							<div class="deps">
								depends on
								{#each e.deps as d (d)}<span class="dep">{d}</span>{/each}
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<p class="empty">No colors yet — define some in the editor.</p>
	{/if}

	{#if scheme.nonColorVars.length > 0}
		<div class="values">
			<div class="sec">Values</div>
			{#each scheme.nonColorVars as v (v.name)}
				<div class="val-row">
					<span class="name">{v.name}</span>
					<span class="val mono">{fmtVal(v.value)}</span>
				</div>
			{/each}
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
	.grid {
		display: grid;
		gap: 8px;
	}
	.row {
		display: flex;
		gap: 12px;
		padding: 8px;
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
		width: 76px;
		flex-shrink: 0;
		align-self: stretch;
		min-height: 52px;
		border-radius: var(--radius-sm);
		border: 1px solid color-mix(in srgb, var(--text) 12%, transparent);
		display: flex;
		align-items: flex-end;
		justify-content: center;
		padding-bottom: 4px;
	}
	.sw-hex {
		font-size: 10px;
		font-weight: 600;
		color: #fff;
		mix-blend-mode: difference;
		opacity: 0.9;
	}
	.meta {
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 3px;
		min-width: 0;
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
	.coord {
		font-size: 11.5px;
		color: var(--text-muted);
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
	.deps {
		display: flex;
		align-items: center;
		gap: 5px;
		flex-wrap: wrap;
		font-size: 11px;
		color: var(--text-faint);
	}
	.dep {
		padding: 0 6px;
		border-radius: 99px;
		background: var(--surface-2);
		color: var(--text-muted);
		font-weight: 500;
	}
	.empty {
		color: var(--text-faint);
		font-size: 13px;
		padding: 8px;
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
	.val-row {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 6px 10px;
		border-radius: var(--radius-sm);
		background: var(--surface-2);
		margin-bottom: 4px;
	}
	.val {
		font-size: 12px;
		color: var(--text-muted);
	}
</style>
