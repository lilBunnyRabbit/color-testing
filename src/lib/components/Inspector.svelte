<script lang="ts">
	import type { Scheme } from '$lib/scheme/types';
	import type { ColorValue } from '$lib/models';
	import type { DSLValue } from '$lib/dsl/evaluator.js';

	let { scheme }: { scheme: Scheme } = $props();

	function fmtOklch(c: ColorValue): string {
		const l = Math.round(c.channel('ok_l') * 1000) / 1000;
		const ch = Math.round(c.channel('ok_c') * 10000) / 10000;
		const h = Math.round(c.channel('ok_h') * 100) / 100;
		return `oklch(${l}, ${ch}, ${h})`;
	}
	function textOn(c: ColorValue): string {
		return c.channel('ok_l') > 0.6 ? '#1a1a1a' : '#f0f0f0';
	}
	function fmtVal(v: DSLValue): string {
		if (typeof v === 'number') return String(Math.round(v * 10000) / 10000);
		if (Array.isArray(v)) return `[${v.length} items]`;
		return String(v);
	}
</script>

<div class="flex-1 overflow-y-auto p-4">
	{#if scheme.entries.length > 0}
		<div class="grid gap-2">
			{#each scheme.entries as e (e.name)}
				<div class="flex items-stretch gap-3 rounded-lg bg-[#18181b] p-3">
					<div
						class="flex w-20 shrink-0 items-center justify-center rounded-md font-mono text-xs"
						style="background-color: {e.color.hex}; color: {textOn(e.color)}"
					>
						{e.color.hex}
					</div>
					<div class="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
						<div class="flex items-center gap-2">
							<span class="font-mono text-sm font-semibold text-[#e4e4e8]">{e.name}</span>
							<span class="rounded bg-[#0e0e10] px-1 py-0.5 text-[10px] text-[#666]">{e.model}</span>
							{#if !e.color.inGamut}
								<span class="rounded bg-yellow-900/40 px-1.5 py-0.5 text-[10px] text-yellow-400"
									>out of gamut</span
								>
							{:else if e.color.inP3}
								<span class="rounded bg-sky-900/40 px-1.5 py-0.5 text-[10px] text-sky-400">P3</span>
							{/if}
						</div>
						<span class="font-mono text-xs text-[#666]">{fmtOklch(e.color)}</span>
						{#if e.deps.length > 0}
							<span class="text-xs text-[#555]">depends on: {e.deps.join(', ')}</span>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<p class="text-sm text-[#555]">No colors yet — define some in the editor.</p>
	{/if}

	{#if scheme.nonColorVars.length > 0}
		<div class="mt-4">
			<h2 class="mb-2 text-xs font-semibold tracking-wide text-[#555]">VALUES</h2>
			<div class="grid gap-1">
				{#each scheme.nonColorVars as v (v.name)}
					<div class="flex items-center gap-2 rounded bg-[#18181b] px-3 py-1.5">
						<span class="font-mono text-sm text-[#e4e4e8]">{v.name}</span>
						<span class="font-mono text-xs text-[#888]">= {fmtVal(v.value)}</span>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
