<script lang="ts">
	import { base } from '$app/paths';
	import { OKLCH, contrastRatio, contrastRatioAlpha, wcagLevels, wcagColor, simulateVision, visionSimulations, resolveGroups, type ColorGroup, type WcagLevel, type VisionSimulation } from '$lib/oklch';

	type SchemeModule = { default: ColorGroup[] };
	const modules = import.meta.glob<SchemeModule>('../lib/schemes/*.ts', { eager: true });

	const schemes = Object.entries(modules).map(([path, mod]) => ({
		name: path.split('/').pop()!.replace('.ts', ''),
		groups: mod.default
	}));

	let schemeIndex = $state(0);
	let selected = $state<{ bgIdx: number; fgIdx: number } | null>(null);
	let dialogEl = $state<HTMLDialogElement | null>(null);
	let infoDialogEl = $state<HTMLDialogElement | null>(null);

	let fgOpacityInput = $state(100);
	let fgOpacity = $state(100);
	let opacityTimer: ReturnType<typeof setTimeout>;
	function onOpacityInput(e: Event) {
		fgOpacityInput = +(e.target as HTMLInputElement).value;
		clearTimeout(opacityTimer);
		opacityTimer = setTimeout(() => { fgOpacity = fgOpacityInput; }, 150);
	}
	const fgAlpha = $derived(fgOpacity / 100);

	let visionSim = $state<VisionSimulation>('none');

	const resolvedGroups = $derived(resolveGroups(schemes[schemeIndex]?.groups ?? []));
	const groups = $derived(
		visionSim === 'none'
			? resolvedGroups
			: resolvedGroups.map((g) => ({
					...g,
					colors: g.colors.map((c) => simulateVision(c, visionSim))
				}))
	);
	const colors = $derived(groups.flatMap((g) => g.colors));

	// Build grid column template: auto (row header) + for each group: repeat(n, 1fr), separated by 16px gaps
	const colTemplate = $derived(
		'auto ' + groups.map((g) => `repeat(${g.colors.length}, 1fr)`).join(' 6px ')
	);

	// Track which flat index each group starts at
	const groupStarts = $derived(() => {
		const starts: number[] = [];
		let idx = 0;
		for (const g of groups) {
			starts.push(idx);
			idx += g.colors.length;
		}
		return starts;
	});

	const sel = $derived(
		selected && colors[selected.bgIdx] && colors[selected.fgIdx]
			? { bg: colors[selected.bgIdx], fg: colors[selected.fgIdx] }
			: null
	);
	const selRatio = $derived(sel ? contrastRatioAlpha(sel.fg, sel.bg, fgAlpha) : 0);
	const selLevels = $derived(wcagLevels(selRatio));

	function fmtOklch(color: { l: number; c: number; h: number }): string {
		const fmt = (v: number, max: number) => {
			const s = v.toFixed(max);
			return s.includes('.') ? s.replace(/0+$/, '').replace(/\.$/, '') : s;
		};
		return `oklch(${fmt(color.l, 5)} ${fmt(color.c, 5)} ${fmt(color.h, 5)})`;
	}

	function selectCell(bgIdx: number, fgIdx: number) {
		selected = { bgIdx, fgIdx };
		dialogEl?.showModal();
	}

	function closeDialog() {
		dialogEl?.close();
		selected = null;
	}

	const markdownTable = $derived.by(() => {
		const allColors = groups.flatMap((g) => g.colors);
		if (!allColors.length) return '';

		const rows = allColors.map((c) => ({
			name: c.name,
			hex: c.hex,
			oklch: fmtOklch(c),
			comment: c.description ?? '',
		}));

		const w = {
			name: Math.max(4, ...rows.map((r) => r.name.length)),
			hex: Math.max(3, ...rows.map((r) => r.hex.length)),
			oklch: Math.max(5, ...rows.map((r) => r.oklch.length)),
			comment: Math.max(7, ...rows.map((r) => r.comment.length)),
		};

		const pad = (s: string, len: number) => s + ' '.repeat(len - s.length);
		const sep = `| ${'-'.repeat(w.name)} | ${'-'.repeat(w.hex)} | ${'-'.repeat(w.oklch)} | ${'-'.repeat(w.comment)} |`;
		const header = `| ${pad('name', w.name)} | ${pad('hex', w.hex)} | ${pad('oklch', w.oklch)} | ${pad('comment', w.comment)} |`;
		const body = rows.map((r) =>
			`| ${pad(r.name, w.name)} | ${pad(r.hex, w.hex)} | ${pad(r.oklch, w.oklch)} | ${pad(r.comment, w.comment)} |`
		);

		return [header, sep, ...body].join('\n');
	});

	function copyMarkdown() {
		navigator.clipboard.writeText(markdownTable);
	}
</script>

<div class="app">
	<!-- Header -->
	<header class="app-header">
		<h1 class="app-title">Color Scheme Tester</h1>
		<select class="app-select" bind:value={schemeIndex}>
			{#each schemes as scheme, i}
				<option value={i}>{scheme.name}</option>
			{/each}
		</select>
		<span class="app-count">{colors.length} colors</span>
		<button class="app-info-btn" onclick={() => infoDialogEl?.showModal()}>Scheme Info</button>
		<a href="{base}/demo" class="app-info-btn" style="text-decoration: none">Demo</a>

		<label class="app-opacity">
			<span>fg opacity: {fgOpacityInput}%</span>
			<input type="range" min="0" max="100" value={fgOpacityInput} oninput={onOpacityInput} />
		</label>

		<select class="app-select" bind:value={visionSim}>
			{#each visionSimulations as sim}
				<option value={sim.value}>{sim.label}</option>
			{/each}
		</select>

		<div class="app-swatches">
			{#each colors as color}
				<div
					class="app-swatch"
					style="background: {color.toCSS()}"
					title="{color.name} ({color.hex})"
				></div>
			{/each}
		</div>
	</header>

	<!-- Matrix -->
	<div class="matrix-scroll">
		<div class="matrix-grid" style="grid-template-columns: {colTemplate}">
			<!-- Corner -->
			<div class="matrix-corner">fg &#x2193; &nbsp; bg &#x2192;</div>

			<!-- Column headers (bg) with group separators -->
			{#each groups as colGroup, cgi}
				{#if cgi > 0}
					<div class="matrix-col-sep"></div>
				{/if}
				{#each colGroup.colors as bg, ci}
					<div class="matrix-col-header">
						<span class="header-name" title={bg.name}>{bg.name}</span>
						<span class="header-hex">{bg.hex}</span>
						<span class="header-oklch">{fmtOklch(bg)}</span>
						<div class="header-swatch-wide" style="background: {bg.toCSS()}"></div>
					</div>
				{/each}
			{/each}

			<!-- Rows (fg) with group separators -->
			{#each groups as rowGroup, rgi}
				<!-- Row group separator -->
				{#if rgi > 0}
					<div class="matrix-row-sep" style="grid-column: 1 / -1">
						<span class="sep-label">{rowGroup.label}</span>
					</div>
				{/if}

				{#each rowGroup.colors as fg, localFi}
					{@const fgIdx = groups.slice(0, rgi).reduce((s, g) => s + g.colors.length, 0) + localFi}
					<!-- Row header -->
					<div class="matrix-row-header">
						<div class="row-header-text">
							<div class="header-name" title={fg.name}>{fg.name}</div>
							<div class="header-hex">{fg.hex}</div>
							<div class="header-oklch">{fmtOklch(fg)}</div>
						</div>
						<div class="row-header-swatch" style="background: {fg.toCSS()}"></div>
					</div>

					<!-- Cells across all column groups (bg) -->
					{#each groups as colGroup, cgi}
						{#if cgi > 0}
							<div class="matrix-cell-sep"></div>
						{/if}
						{#each colGroup.colors as bg, localBi}
							{@const bgIdx = groups.slice(0, cgi).reduce((s, g) => s + g.colors.length, 0) + localBi}
							{#if bgIdx === fgIdx}
								<div style="background: {bg.toCSS()}"></div>
							{:else}
								{@const ratio = contrastRatioAlpha(fg, bg, fgAlpha)}
								{@const levels = wcagLevels(ratio)}
								<!-- svelte-ignore a11y_click_events_have_key_events -->
								<!-- svelte-ignore a11y_no_static_element_interactions -->
								<div
									class="matrix-cell"
									class:matrix-cell-fail={levels.normal === 'Fail'}
									style="background: {bg.toCSS()}; color: {fg.toCSS()}; --fg-alpha: {fgAlpha}"
									title="{bg.name} bg + {fg.name} fg - {ratio.toFixed(2)}:1 ({levels.normal} / {levels.large})"
									onclick={() => selectCell(bgIdx, fgIdx)}
								>
									<div class="cell-content">
										<div class="cell-header">
											<span class="cell-ratio">{ratio.toFixed(2)}</span>
											<span class="cell-wcag">{levels.normal}</span>
										</div>
										<div class="cell-text-lg">Heading</div>
										<div class="cell-text-md">Body text sample</div>
										<div class="cell-text-sm">Thin caption</div>
										<div class="cell-line" style="background: {fg.toCSS()}"></div>
										<div class="cell-shapes">
											<div class="cell-dot" style="background: {fg.toCSS()}"></div>
											<div class="cell-ring" style="border-color: {fg.toCSS()}"></div>
											<div class="cell-bar" style="background: {fg.toCSS()}"></div>
										</div>
									</div>
								</div>
							{/if}
						{/each}
					{/each}
				{/each}
			{/each}
		</div>
	</div>
</div>

<!-- Detail Modal -->
<dialog
	bind:this={dialogEl}
	class="detail-dialog"
	onclick={(e) => { if (e.target === dialogEl) closeDialog(); }}
	onclose={() => (selected = null)}
>
	{#if sel}
		<div class="dialog-inner">
			<div class="dialog-info-bar">
				<div class="dialog-color-info">
					<div class="dialog-swatch" style="background: {sel.bg.toCSS()}"></div>
					<div>
						<div class="dialog-color-name">{sel.bg.name}</div>
						<div class="dialog-color-value">{sel.bg.hex} &middot; {sel.bg.toCSS()}</div>
					</div>
				</div>
				<span class="dialog-on">on</span>
				<div class="dialog-color-info">
					<div class="dialog-swatch" style="background: {sel.fg.toCSS()}"></div>
					<div>
						<div class="dialog-color-name">{sel.fg.name}</div>
						<div class="dialog-color-value">{sel.fg.hex} &middot; {sel.fg.toCSS()}</div>
					</div>
				</div>

				<div class="dialog-stats">
					<div class="dialog-stat">
						<div class="dialog-ratio">{selRatio.toFixed(2)}:1</div>
						<div class="dialog-stat-label">Contrast Ratio</div>
					</div>
					<div class="dialog-stat">
						<div class="dialog-badge" style="background: {wcagColor(selLevels.normal)}">
							{selLevels.normal}
						</div>
						<div class="dialog-stat-label">Normal Text</div>
					</div>
					<div class="dialog-stat">
						<div class="dialog-badge" style="background: {wcagColor(selLevels.large)}">
							{selLevels.large}
						</div>
						<div class="dialog-stat-label">Large Text</div>
					</div>
					<button class="dialog-close" onclick={closeDialog}>Close</button>
				</div>
			</div>

			<div class="dialog-preview" style="background: {sel.bg.toCSS()}; color: {sel.fg.toCSS()}">
				<div class="dialog-preview-grid">
					<!-- Typography -->
					<div class="dialog-section">
						<h3 class="dialog-section-title">Font Weights</h3>
						{#each [
							[100, 'Thin'], [200, 'Extra Light'], [300, 'Light'],
							[400, 'Regular'], [500, 'Medium'], [600, 'Semibold'],
							[700, 'Bold'], [800, 'Extra Bold'], [900, 'Black']
						] as [weight, label]}
							<p style="font-weight: {weight}" class="dialog-weight-line">
								<span class="dialog-weight-label">{weight} {label}</span>
								The quick brown fox jumps over the lazy dog
							</p>
						{/each}

						<h3 class="dialog-section-title" style="margin-top: 20px">Font Sizes</h3>
						<div class="dialog-sizes">
							{#each [10, 12, 14, 16, 18, 20, 24, 28, 32, 40, 48] as size}
								<span style="font-size: {size}px">{size}px</span>
							{/each}
						</div>

						<h3 class="dialog-section-title" style="margin-top: 20px">Text Styles</h3>
						<p style="font-style: italic">Italic - The quick brown fox jumps over the lazy dog</p>
						<p style="text-decoration: underline">Underlined text sample</p>
						<p style="text-decoration: line-through">Strikethrough text sample</p>
						<p style="text-transform: uppercase; letter-spacing: 0.05em; font-size: 14px">Uppercase tracked text</p>
					</div>

					<!-- UI Elements -->
					<div class="dialog-section">
						<h3 class="dialog-section-title">Lines & Borders</h3>
						<hr style="border-color: {sel.fg.toCSS()}; border-top-width: 1px; opacity: 1" />
						<hr style="border-color: {sel.fg.toCSS()}; border-top-width: 2px; opacity: 1" />
						<hr style="border-color: {sel.fg.toCSS()}; border-top-width: 1px; opacity: 0.5" />

						<div class="dialog-box" style="border: 1px solid {sel.fg.toCSS()}">
							Bordered container with text content
						</div>
						<div class="dialog-box" style="border: 2px solid {sel.fg.toCSS()}">
							Thick bordered container
						</div>

						<h3 class="dialog-section-title" style="margin-top: 20px">UI Elements</h3>
						<div class="dialog-ui-row">
							<button class="dialog-btn-filled" style="background: {sel.fg.toCSS()}; color: {sel.bg.toCSS()}">Filled Button</button>
							<button class="dialog-btn-outline" style="border-color: {sel.fg.toCSS()}; color: {sel.fg.toCSS()}">Outlined Button</button>
							<span class="dialog-badge-ui" style="background: {sel.fg.toCSS()}; color: {sel.bg.toCSS()}">Badge</span>
							<span style="text-decoration: underline; font-size: 14px">Link Text</span>
						</div>

						<h3 class="dialog-section-title" style="margin-top: 20px">Blocks</h3>
						<div class="dialog-box" style="background: {sel.fg.toCSS()}; color: {sel.bg.toCSS()}; border: none">
							Inverted block - foreground as background, background as text. Shows the reverse combination for emphasis areas, buttons, or highlights.
						</div>

						<p style="font-size: 14px; line-height: 1.6">
							Full opacity: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
						</p>
						<p style="font-size: 14px; line-height: 1.6; opacity: 0.65">
							Muted (65%): Lorem ipsum dolor sit amet, consectetur adipiscing elit.
						</p>
						<p style="font-size: 14px; line-height: 1.6; opacity: 0.38">
							Disabled (38%): Lorem ipsum dolor sit amet, consectetur adipiscing elit.
						</p>

						<h3 class="dialog-section-title" style="margin-top: 20px">Shapes</h3>
						<div class="dialog-shapes">
							<div style="width:16px;height:16px;border-radius:50%;background:{sel.fg.toCSS()}"></div>
							<div style="width:16px;height:16px;background:{sel.fg.toCSS()}"></div>
							<div style="width:16px;height:16px;border-radius:50%;border:2px solid {sel.fg.toCSS()}"></div>
							<div style="width:16px;height:16px;border:2px solid {sel.fg.toCSS()}"></div>
							<div style="width:24px;height:24px;border-radius:50%;background:{sel.fg.toCSS()}"></div>
							<div style="width:24px;height:24px;background:{sel.fg.toCSS()}"></div>
							<div style="width:32px;height:32px;border-radius:50%;background:{sel.fg.toCSS()}"></div>
							<div style="height:4px;width:64px;background:{sel.fg.toCSS()}"></div>
							<div style="height:2px;width:64px;background:{sel.fg.toCSS()}"></div>
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}
</dialog>

<!-- Scheme Info Dialog -->
<dialog
	bind:this={infoDialogEl}
	class="info-dialog"
	onclick={(e) => { if (e.target === infoDialogEl) infoDialogEl?.close(); }}
>
	<div class="info-inner">
		<div class="info-header">
			<h2 class="info-title">Scheme: {schemes[schemeIndex]?.name}</h2>
			<button class="info-copy-btn" onclick={copyMarkdown}>Copy Markdown</button>
			<button class="dialog-close" onclick={() => infoDialogEl?.close()}>Close</button>
		</div>
		<div class="info-body">
			{#each groups as group, gi}
				<div class="info-group-label">{group.label}</div>
				{#each group.colors as color}
					<div class="info-color-row">
						<div class="info-color-swatch" style="background: {color.toCSS()}"></div>
						<div class="info-color-details">
							<div class="info-color-name">{color.name}</div>
							<div class="info-color-values">
								<span class="info-value">{color.hex}</span>
								<span class="info-value">{fmtOklch(color)}</span>
								{#if !color.isInGamut}
									<span class="info-oog">out of sRGB (mapped: {color.gamutMapped.hex})</span>
								{:else if color.isInP3}
									<span class="info-p3">P3</span>
								{/if}
							</div>
							{#if color.description}
								<div class="info-description">{color.description}</div>
							{/if}
						</div>
					</div>
				{/each}
			{/each}
			<div class="info-markdown">
				<pre class="info-markdown-pre">{markdownTable}</pre>
			</div>
		</div>
	</div>
</dialog>

<style>
	/* App chrome - pure black/white */
	.app {
		display: flex;
		flex-direction: column;
		height: 100vh;
		background: #000;
		color: #fff;
	}

	.app-header {
		display: flex;
		align-items: center;
		gap: 16px;
		padding: 12px 20px;
		border-bottom: 1px solid #333;
		flex-shrink: 0;
	}

	.app-title {
		font-size: 18px;
		font-weight: 600;
		letter-spacing: -0.02em;
	}

	.app-select {
		border: 1px solid #555;
		border-radius: 4px;
		background: #111;
		color: #fff;
		padding: 4px 8px;
		font-size: 14px;
	}

	.app-count {
		font-size: 12px;
		color: #888;
	}

	.app-info-btn {
		padding: 4px 12px;
		border: 1px solid #555;
		border-radius: 4px;
		background: none;
		color: #fff;
		font-size: 13px;
		cursor: pointer;
	}

	.app-info-btn:hover {
		border-color: #999;
	}

	.app-opacity {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 12px;
		color: #ccc;
	}

	.app-opacity input[type='range'] {
		width: 100px;
	}

	.app-swatches {
		margin-left: auto;
		display: flex;
		gap: 4px;
		overflow: hidden;
		min-width: 0;
		flex-shrink: 1;
	}

	.app-swatch {
		width: 24px;
		height: 24px;
		border-radius: 4px;
		border: 1px solid #333;
		flex-shrink: 0;
	}

	/* Matrix */
	.matrix-scroll {
		flex: 1;
		min-height: 0;
		overflow: auto;
	}

	.matrix-grid {
		display: grid;
		gap: 2px;
		width: max-content;
	}

	.matrix-corner {
		position: sticky;
		top: 0;
		left: 0;
		z-index: 30;
		background: #000;
		padding: 8px;
		font-size: 11px;
		color: #666;
		display: flex;
		align-items: end;
	}

	.matrix-col-header {
		position: sticky;
		top: 0;
		z-index: 20;
		background: #000;
		padding: 4px 0 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
	}

	.matrix-row-header {
		position: sticky;
		left: 0;
		z-index: 10;
		background: #000;
		padding: 0;
		display: flex;
		flex-direction: row;
		align-items: stretch;
		min-width: 9rem;
	}

	.header-swatch-wide {
		width: 100%;
		height: 12px;
		flex-shrink: 0;
	}

	.row-header-swatch {
		width: 12px;
		flex-shrink: 0;
	}

	.row-header-text {
		padding: 4px 8px 6px;
		flex: 1;
		min-width: 0;
	}

	.header-name {
		font-size: 11px;
		color: #ccc;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		width: 11rem;
		text-align: center;
	}

	.row-header-text .header-name {
		text-align: left;
		width: auto;
	}

	.header-hex {
		font-family: monospace;
		font-size: 9px;
		color: #888;
	}

	.header-oklch {
		font-family: monospace;
		font-size: 9px;
		color: #555;
	}

	.matrix-cell {
		cursor: pointer;
	}

	.matrix-cell-fail {
		clip-path: polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 0 100%);
	}

	/* Cell content */
	.cell-content {
		width: 11rem;
		padding: 6px 8px;
		display: flex;
		flex-direction: column;
		gap: 3px;
		overflow: hidden;
		opacity: var(--fg-alpha, 1);
	}

	.cell-header {
		display: flex;
		align-items: baseline;
		gap: 4px;
		font-family: monospace;
	}

	.cell-ratio {
		font-size: 11px;
		font-weight: 700;
	}

	.cell-wcag {
		font-size: 9px;
		font-weight: 700;
		opacity: 0.7;
	}

	.cell-text-lg {
		font-size: 15px;
		font-weight: 700;
		line-height: 1.1;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.cell-text-md {
		font-size: 11px;
		font-weight: 400;
		line-height: 1.2;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.cell-text-sm {
		font-size: 9px;
		font-weight: 200;
		line-height: 1.2;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.cell-line {
		height: 1px;
	}

	.cell-shapes {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.cell-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.cell-ring {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		border: 1.5px solid;
		flex-shrink: 0;
	}

	.cell-bar {
		height: 6px;
		flex: 1;
		border-radius: 3px;
		min-width: 0;
	}

	/* Dialog */
	.detail-dialog {
		padding: 0;
		border: none;
		border-radius: 12px;
		max-width: 90vw;
		max-height: 90vh;
		width: 900px;
		overflow: hidden;
		background: transparent;
		color: inherit;
		margin: auto;
	}

	.detail-dialog::backdrop {
		background: rgba(0, 0, 0, 0.7);
	}

	.dialog-inner {
		display: flex;
		flex-direction: column;
		max-height: 90vh;
	}

	.dialog-info-bar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 16px;
		padding: 12px 20px;
		background: #000;
		color: #fff;
		font-size: 14px;
	}

	.dialog-color-info {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.dialog-swatch {
		width: 28px;
		height: 28px;
		border-radius: 4px;
		border: 1px solid #333;
	}

	.dialog-color-name {
		font-weight: 500;
	}

	.dialog-color-value {
		font-family: monospace;
		font-size: 11px;
		color: #888;
	}

	.dialog-on {
		color: #666;
	}

	.dialog-stats {
		margin-left: auto;
		display: flex;
		align-items: center;
		gap: 20px;
	}

	.dialog-stat {
		text-align: center;
	}

	.dialog-ratio {
		font-family: monospace;
		font-size: 20px;
		font-weight: 700;
	}

	.dialog-stat-label {
		font-size: 10px;
		color: #888;
	}

	.dialog-badge {
		color: #000;
		font-weight: 700;
		font-size: 14px;
		padding: 2px 8px;
		border-radius: 4px;
	}

	.dialog-close {
		margin-left: 8px;
		padding: 6px 12px;
		border-radius: 4px;
		color: #888;
		background: none;
		border: 1px solid #333;
		cursor: pointer;
	}

	.dialog-close:hover {
		color: #fff;
		border-color: #666;
	}

	.dialog-preview {
		overflow: auto;
		flex: 1;
		min-height: 0;
	}

	.dialog-preview-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 32px;
		padding: 32px;
	}

	.dialog-section {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.dialog-section-title {
		font-size: 10px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		opacity: 0.5;
		margin-bottom: 4px;
	}

	.dialog-weight-line {
		font-size: 14px;
		line-height: 1.3;
	}

	.dialog-weight-label {
		display: inline-block;
		width: 96px;
		font-family: monospace;
		font-size: 10px;
		opacity: 0.4;
	}

	.dialog-sizes {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 12px;
	}

	.dialog-box {
		border-radius: 6px;
		padding: 12px;
		font-size: 14px;
	}

	.dialog-ui-row {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		align-items: center;
	}

	.dialog-btn-filled {
		padding: 6px 12px;
		border-radius: 4px;
		font-size: 14px;
		font-weight: 500;
		border: none;
		cursor: pointer;
	}

	.dialog-btn-outline {
		padding: 6px 12px;
		border-radius: 4px;
		font-size: 14px;
		font-weight: 500;
		border: 1px solid;
		background: none;
		cursor: pointer;
	}

	.dialog-badge-ui {
		padding: 2px 10px;
		border-radius: 99px;
		font-size: 12px;
		font-weight: 600;
	}

	.dialog-shapes {
		display: flex;
		align-items: center;
		gap: 12px;
		flex-wrap: wrap;
	}

	/* Info dialog */
	.info-dialog {
		padding: 0;
		border: none;
		border-radius: 12px;
		max-width: 700px;
		max-height: 90vh;
		width: 90vw;
		overflow: hidden;
		background: #000;
		color: #fff;
		margin: auto;
	}

	.info-dialog::backdrop {
		background: rgba(0, 0, 0, 0.7);
	}

	.info-inner {
		display: flex;
		flex-direction: column;
		max-height: 90vh;
	}

	.info-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px 20px;
		border-bottom: 1px solid #333;
	}

	.info-title {
		font-size: 16px;
		font-weight: 600;
	}

	.info-body {
		overflow: auto;
		flex: 1;
		min-height: 0;
	}

	.info-color-row {
		display: flex;
		border-bottom: 1px solid #1a1a1a;
	}

	.info-color-swatch {
		width: 48px;
		flex-shrink: 0;
	}

	.info-color-details {
		padding: 10px 16px;
		flex: 1;
		min-width: 0;
	}

	.info-color-name {
		font-size: 14px;
		font-weight: 600;
	}

	.info-color-values {
		display: flex;
		gap: 12px;
		margin-top: 2px;
	}

	.info-value {
		font-family: monospace;
		font-size: 12px;
		color: #888;
	}

	.info-oog {
		font-size: 11px;
		color: #ef4444;
	}

	.info-p3 {
		font-size: 11px;
		color: #60a5fa;
	}

	.info-description {
		margin-top: 3px;
		font-family: monospace;
		font-size: 12px;
		color: #888;
	}

	.info-copy-btn {
		padding: 4px 12px;
		border: 1px solid #555;
		border-radius: 4px;
		background: none;
		color: #fff;
		font-size: 13px;
		cursor: pointer;
		margin-left: auto;
	}
	.info-copy-btn:hover { border-color: #999; }

	.info-markdown {
		padding: 12px 16px;
		border-top: 1px solid #222;
	}

	.info-markdown-pre {
		font-family: monospace;
		font-size: 11px;
		color: #888;
		white-space: pre;
		overflow-x: auto;
		margin: 0;
		line-height: 1.5;
	}

	.info-group-label {
		padding: 8px 16px 4px;
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #666;
		border-top: 1px solid #222;
	}

	/* Group separators */
	.matrix-col-sep {
		position: sticky;
		top: 0;
		z-index: 20;
		background: #000;
	}

	.matrix-row-sep {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 2px 8px;
		background: #000;
	}

	.sep-label {
		font-size: 10px;
		color: #555;
		white-space: nowrap;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.matrix-cell-sep {
		background: #000;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.app-header {
			flex-wrap: wrap;
			gap: 8px;
			padding: 10px 12px;
		}

		.app-title {
			font-size: 15px;
			width: 100%;
		}

		.app-swatches {
			margin-left: 0;
			width: 100%;
			order: 10;
		}

		.app-opacity input[type='range'] {
			width: 70px;
		}

		/* Detail dialog */
		.detail-dialog {
			max-width: 98vw;
			max-height: 95vh;
			width: 98vw;
			border-radius: 8px;
		}

		.dialog-inner {
			max-height: 95vh;
		}

		.dialog-info-bar {
			flex-direction: column;
			align-items: flex-start;
			gap: 10px;
			padding: 10px 14px;
		}

		.dialog-stats {
			margin-left: 0;
			width: 100%;
			justify-content: space-between;
		}

		.dialog-preview-grid {
			grid-template-columns: 1fr;
			gap: 24px;
			padding: 16px;
		}

		/* Info dialog */
		.info-dialog {
			max-width: 98vw;
			max-height: 95vh;
			width: 98vw;
			border-radius: 8px;
		}

		.info-header {
			flex-wrap: wrap;
			gap: 8px;
			padding: 12px 14px;
		}

		.info-title {
			width: 100%;
		}

		.info-color-values {
			flex-wrap: wrap;
			gap: 6px;
		}
	}
</style>
