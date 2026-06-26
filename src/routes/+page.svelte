<script lang="ts">
	import { evaluate, type EvalResult, type DSLValue } from '$lib/dsl/evaluator.js';
	import { Color } from '$lib/dsl/color.js';
	import Editor from '$lib/Editor.svelte';
	import { examples } from './examples';

	const EXAMPLES: Record<string, string> = Object.fromEntries(
		examples.map((e) => [e.name, e.source])
	);
	const exampleNames = examples.map((e) => e.name);

	let currentExample = $state(exampleNames[0]);
	let source = $state(EXAMPLES[currentExample]);
	let result: EvalResult = $state(evaluate(source));

	let debounceTimer: ReturnType<typeof setTimeout>;

	function onInput() {
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			result = evaluate(source);
		}, 100);
	}

	function formatValue(val: DSLValue): string {
		if (val instanceof Color) return val.hex;
		if (typeof val === 'number') return String(Math.round(val * 10000) / 10000);
		return String(val);
	}

	function formatOklch(val: DSLValue): string {
		if (!(val instanceof Color)) return '';
		const l = Math.round(val.ok_l * 1000) / 1000;
		const c = Math.round(val.ok_c * 10000) / 10000;
		const h = Math.round(val.ok_h * 100) / 100;
		return `oklch(${l}, ${c}, ${h})`;
	}

	function textColor(val: DSLValue): string {
		if (!(val instanceof Color)) return '#ccc';
		return val.ok_l > 0.6 ? '#1a1a1a' : '#f0f0f0';
	}

	let colorVars = $derived(
		result.order
			.map((name) => result.variables.get(name)!)
			.filter((v) => v.value instanceof Color)
	);

	let nonColorVars = $derived(
		result.order
			.map((name) => result.variables.get(name)!)
			.filter((v) => !(v.value instanceof Color))
	);

	let showDocs = $state(false);

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && showDocs) {
			showDocs = false;
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<svelte:head>
	<title>Chromatics DSL</title>
</svelte:head>

<div class="flex h-screen bg-[#0e0e10] text-[#c8c8d0]">
	<!-- Editor Panel -->
	<div class="flex w-1/2 flex-col border-r border-[#2a2a30]">
		<div class="flex items-center gap-2 border-b border-[#2a2a30] px-4 py-2">
			<h1 class="text-sm font-semibold tracking-wide text-[#8888a0]">EDITOR</h1>
			<select
				class="rounded bg-[#18181b] px-2 py-0.5 text-xs text-[#8888a0] outline-none"
				bind:value={currentExample}
				onchange={() => {
					source = EXAMPLES[currentExample];
					result = evaluate(source);
				}}
			>
				{#each exampleNames as name}
					<option value={name}>{name}</option>
				{/each}
			</select>
			{#if result.errors.length > 0}
				<span class="rounded bg-red-900/40 px-2 py-0.5 text-xs text-red-400">
					{result.errors.length} error{result.errors.length > 1 ? 's' : ''}
				</span>
			{/if}
			<div class="flex-1"></div>
			<button
				class="rounded px-2 py-0.5 text-xs text-[#8888a0] transition-colors hover:bg-[#2a2a30] hover:text-[#c8c8d0]"
				class:bg-[#2a2a30]={showDocs}
				class:text-[#c8c8d0]={showDocs}
				onclick={() => (showDocs = !showDocs)}
			>
				API Docs
			</button>
		</div>

		<div class="relative flex-1 overflow-hidden">
			<Editor bind:value={source} onchange={onInput} />

			<!-- API Docs overlay -->
			{#if showDocs}
				<div class="absolute inset-0 overflow-y-auto bg-[#0e0e10]/95 p-5 backdrop-blur-sm">
					<div class="mx-auto max-w-xl space-y-5 text-sm">
						<!-- Constructors -->
						<section>
							<h2 class="mb-2 text-xs font-semibold tracking-wide text-[#8888a0]">CONSTRUCTORS</h2>
							<div class="space-y-1 font-mono text-xs">
								<div><span class="text-amber-400">HSL</span><span class="text-[#666]">(h: 0-360, s: 0-1, l: 0-1)</span> <span class="text-[#555]">&#8594; Color</span></div>
								<div><span class="text-amber-400">RGB</span><span class="text-[#666]">(r: 0-1, g: 0-1, b: 0-1)</span> <span class="text-[#555]">&#8594; Color</span></div>
								<div><span class="text-amber-400">OKLCH</span><span class="text-[#666]">(l: 0-1, c: 0-0.4, h: 0-360)</span> <span class="text-[#555]">&#8594; Color</span></div>
								<div><span class="text-amber-400">hex</span><span class="text-[#666]">(str: "#rrggbb")</span> <span class="text-[#555]">&#8594; Color</span></div>
							</div>
						</section>

						<!-- Color Properties -->
						<section>
							<h2 class="mb-2 text-xs font-semibold tracking-wide text-[#8888a0]">COLOR PROPERTIES</h2>
							<div class="grid grid-cols-2 gap-x-6 gap-y-1 font-mono text-xs">
								<div class="col-span-2 mb-1 text-[#555]">OKLCH</div>
								<div><span class="text-sky-400">.ok_l</span> <span class="text-[#555]">lightness 0-1</span></div>
								<div><span class="text-sky-400">.ok_c</span> <span class="text-[#555]">chroma 0-0.4</span></div>
								<div><span class="text-sky-400">.ok_h</span> <span class="text-[#555]">hue 0-360</span></div>
								<div></div>
								<div class="col-span-2 mb-1 mt-2 text-[#555]">HSL</div>
								<div><span class="text-sky-400">.h</span> <span class="text-[#555]">hue 0-360</span></div>
								<div><span class="text-sky-400">.s</span> <span class="text-[#555]">saturation 0-1</span></div>
								<div><span class="text-sky-400">.l</span> <span class="text-[#555]">lightness 0-1</span></div>
								<div></div>
								<div class="col-span-2 mb-1 mt-2 text-[#555]">RGB</div>
								<div><span class="text-sky-400">.r</span> <span class="text-[#555]">red 0-1</span></div>
								<div><span class="text-sky-400">.g</span> <span class="text-[#555]">green 0-1</span></div>
								<div><span class="text-sky-400">.b</span> <span class="text-[#555]">blue 0-1</span></div>
								<div></div>
								<div class="col-span-2 mb-1 mt-2 text-[#555]">Output</div>
								<div><span class="text-sky-400">.hex</span> <span class="text-[#555]">"#rrggbb"</span></div>
								<div><span class="text-sky-400">.inGamut</span> <span class="text-[#555]">bool (sRGB)</span></div>
								<div><span class="text-sky-400">.inP3</span> <span class="text-[#555]">bool (Display P3)</span></div>
								<div><span class="text-sky-400">.gamutMapped</span> <span class="text-[#555]">Color (clamped)</span></div>
							</div>
						</section>

						<!-- Color Methods -->
						<section>
							<h2 class="mb-2 text-xs font-semibold tracking-wide text-[#8888a0]">COLOR METHODS</h2>
							<div class="space-y-1 font-mono text-xs">
								<div><span class="text-emerald-400">.lighten</span><span class="text-[#666]">(amount)</span> <span class="text-[#555]">&#8594; Color &mdash; increase OKLCH lightness</span></div>
								<div><span class="text-emerald-400">.darken</span><span class="text-[#666]">(amount)</span> <span class="text-[#555]">&#8594; Color &mdash; decrease OKLCH lightness</span></div>
								<div><span class="text-emerald-400">.saturate</span><span class="text-[#666]">(amount)</span> <span class="text-[#555]">&#8594; Color &mdash; increase OKLCH chroma</span></div>
								<div><span class="text-emerald-400">.desaturate</span><span class="text-[#666]">(amount)</span> <span class="text-[#555]">&#8594; Color &mdash; decrease OKLCH chroma</span></div>
								<div><span class="text-emerald-400">.rotate</span><span class="text-[#666]">(degrees)</span> <span class="text-[#555]">&#8594; Color &mdash; shift hue</span></div>
								<div><span class="text-emerald-400">.invert</span><span class="text-[#666]">()</span> <span class="text-[#555]">&#8594; Color &mdash; flip lightness + rotate 180</span></div>
								<div><span class="text-emerald-400">.complement</span><span class="text-[#666]">()</span> <span class="text-[#555]">&#8594; Color &mdash; rotate 180</span></div>
								<div><span class="text-emerald-400">.mix</span><span class="text-[#666]">(other, ratio?)</span> <span class="text-[#555]">&#8594; Color &mdash; blend in OKLCH, ratio 0-1 (default 0.5)</span></div>
								<div><span class="text-emerald-400">.shift</span><span class="text-[#666]">(&#123;l?, c?, h?&#125;)</span> <span class="text-[#555]">&#8594; Color &mdash; add deltas to OKLCH channels</span></div>
								<div><span class="text-emerald-400">.derive</span><span class="text-[#666]">(&#123;l?, c?, h?&#125;)</span> <span class="text-[#555]">&#8594; Color &mdash; replace OKLCH channels</span></div>
								<div><span class="text-emerald-400">.contrast</span><span class="text-[#666]">(other)</span> <span class="text-[#555]">&#8594; number &mdash; WCAG contrast ratio</span></div>
							</div>
						</section>

						<!-- Functions -->
						<section>
							<h2 class="mb-2 text-xs font-semibold tracking-wide text-[#8888a0]">FUNCTIONS</h2>
							<div class="space-y-1 font-mono text-xs">
								<div><span class="text-violet-400">mix</span><span class="text-[#666]">(a, b, ratio)</span> <span class="text-[#555]">&#8594; Color</span></div>
								<div><span class="text-violet-400">contrast</span><span class="text-[#666]">(a, b)</span> <span class="text-[#555]">&#8594; number</span></div>
								<div><span class="text-violet-400">clamp</span><span class="text-[#666]">(val, min, max)</span> <span class="text-[#555]">&#8594; number</span></div>
								<div><span class="text-violet-400">abs</span> <span class="text-violet-400">min</span> <span class="text-violet-400">max</span> <span class="text-violet-400">round</span> <span class="text-violet-400">floor</span> <span class="text-violet-400">ceil</span> <span class="text-[#555]">&mdash; standard math</span></div>
							</div>
						</section>

						<!-- Operators -->
						<section>
							<h2 class="mb-2 text-xs font-semibold tracking-wide text-[#8888a0]">OPERATORS</h2>
							<div class="font-mono text-xs text-[#666]">
								<span class="text-[#999]">+</span> <span class="text-[#999]">-</span> <span class="text-[#999]">*</span> <span class="text-[#999]">/</span> <span class="text-[#999]">%</span> <span class="text-[#999]">**</span>
								&nbsp;&nbsp;
								<span class="text-[#999]">&lt;</span> <span class="text-[#999]">&gt;</span> <span class="text-[#999]">&lt;=</span> <span class="text-[#999]">&gt;=</span> <span class="text-[#999]">==</span> <span class="text-[#999]">!=</span>
								&nbsp;&nbsp;
								<span class="text-[#999]">&&</span> <span class="text-[#999]">||</span> <span class="text-[#999]">!</span>
								&nbsp;&nbsp;
								<span class="text-[#999]">? :</span> <span class="text-[#555]">(ternary)</span>
							</div>
						</section>

						<!-- Examples -->
						<section>
							<h2 class="mb-2 text-xs font-semibold tracking-wide text-[#8888a0]">EXAMPLES</h2>
							<div class="space-y-2 font-mono text-xs">
								<div class="rounded bg-[#18181b] p-2">
									<div class="text-[#d4d4d8]">bg = OKLCH(0.25, 0.02, 230)</div>
									<div class="text-[#555]">// dark teal background</div>
								</div>
								<div class="rounded bg-[#18181b] p-2">
									<div class="text-[#d4d4d8]">fg = bg.invert()</div>
									<div class="text-[#555]">// auto foreground from background</div>
								</div>
								<div class="rounded bg-[#18181b] p-2">
									<div class="text-[#d4d4d8]">accent = HSL(280, 0.6, 0.5)</div>
									<div class="text-[#555]">// purple accent via HSL</div>
								</div>
								<div class="rounded bg-[#18181b] p-2">
									<div class="text-[#d4d4d8]">warm = bg.mix(accent, 0.1)</div>
									<div class="text-[#555]">// subtle tinted surface</div>
								</div>
								<div class="rounded bg-[#18181b] p-2">
									<div class="text-[#d4d4d8]">cr = fg.contrast(bg)</div>
									<div class="text-[#555]">// WCAG contrast ratio (number)</div>
								</div>
							</div>
						</section>

						<div class="pt-2 text-center text-xs text-[#444]">
							Press <kbd class="rounded bg-[#2a2a30] px-1.5 py-0.5">Esc</kbd> or click API Docs to close
						</div>
					</div>
				</div>
			{/if}
		</div>

		<!-- Errors -->
		{#if result.errors.length > 0}
			<div class="border-t border-[#2a2a30] bg-red-950/20 px-4 py-2">
				{#each result.errors as err}
					<div class="flex gap-2 text-xs">
						<span class="text-red-500">line {err.line}:</span>
						<span class="text-red-400">{err.message}</span>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Inspector Panel -->
	<div class="flex w-1/2 flex-col">
		<div class="flex items-center gap-2 border-b border-[#2a2a30] px-4 py-2">
			<h1 class="text-sm font-semibold tracking-wide text-[#8888a0]">INSPECTOR</h1>
			<span class="text-xs text-[#555]">
				{colorVars.length} color{colorVars.length !== 1 ? 's' : ''}
			</span>
		</div>

		<div class="flex-1 overflow-y-auto p-4">
			<!-- Color Variables -->
			{#if colorVars.length > 0}
				<div class="grid gap-2">
					{#each colorVars as v}
						{@const c = v.value as Color}
						<div class="flex items-stretch gap-3 rounded-lg bg-[#18181b] p-3">
							<!-- Color swatch -->
							<div
								class="flex w-20 shrink-0 items-center justify-center rounded-md text-xs font-mono"
								style="background-color: {c.hex}; color: {textColor(c)}"
							>
								{c.hex}
							</div>

							<!-- Info -->
							<div class="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
								<div class="flex items-center gap-2">
									<span class="font-mono text-sm font-semibold text-[#e4e4e8]">{v.name}</span>
									{#if !c.inGamut}
										<span
											class="rounded bg-yellow-900/40 px-1.5 py-0.5 text-[10px] text-yellow-400"
											>out of gamut</span
										>
									{/if}
								</div>
								<span class="font-mono text-xs text-[#666]">{formatOklch(c)}</span>
								{#if v.deps.length > 0}
									<span class="text-xs text-[#555]">
										depends on: {v.deps.join(', ')}
									</span>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{/if}

			<!-- Non-color Variables -->
			{#if nonColorVars.length > 0}
				<div class="mt-4">
					<h2 class="mb-2 text-xs font-semibold tracking-wide text-[#555]">VALUES</h2>
					<div class="grid gap-1">
						{#each nonColorVars as v}
							<div class="flex items-center gap-2 rounded bg-[#18181b] px-3 py-1.5">
								<span class="font-mono text-sm text-[#e4e4e8]">{v.name}</span>
								<span class="font-mono text-xs text-[#888]">= {formatValue(v.value)}</span>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Preview -->
			{#if colorVars.length >= 2}
				{@const bg = colorVars.find((v) => v.name.includes('bg') || v.name === 'background')}
				{@const fg = colorVars.find(
					(v) => v.name.includes('fg') || v.name === 'foreground' || v.name === 'muted'
				)}
				{@const pri = colorVars.find(
					(v) => v.name === 'primary' || v.name === 'accent'
				)}

				{#if bg && fg}
					<div class="mt-6">
						<h2 class="mb-2 text-xs font-semibold tracking-wide text-[#555]">PREVIEW</h2>
						<div
							class="overflow-hidden rounded-lg p-6"
							style="background-color: {(bg.value as Color).hex}; color: {(fg.value as Color).hex}"
						>
							<h3
								class="mb-2 text-lg font-bold"
								style={pri ? `color: ${(pri.value as Color).hex}` : ''}
							>
								Theme Preview
							</h3>
							<p class="mb-4 text-sm opacity-80">
								This preview uses your defined colors to show how they work together.
							</p>
							<div class="flex gap-2">
								{#each colorVars.filter((v) => !v.name.startsWith('bg') && v.name !== 'background' && !v.name.startsWith('fg') && v.name !== 'foreground' && v.name !== 'muted') as cv}
									<div
										class="rounded-md px-3 py-1.5 text-xs font-medium"
										style="background-color: {(cv.value as Color).hex}; color: {textColor(cv.value)}"
									>
										{cv.name}
									</div>
								{/each}
							</div>
						</div>
					</div>
				{/if}
			{/if}
		</div>
	</div>
</div>
