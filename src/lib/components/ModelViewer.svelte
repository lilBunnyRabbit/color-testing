<script lang="ts">
	import { allModels, getModel, ColorValue, hex, type ModelDef } from '$lib/models';
	import { MODEL_DOCS } from '$lib/dsl/model-docs';
	import { ui } from '$lib/state/ui.svelte';

	let { seed = '#3aa0ff' }: { seed?: string } = $props();

	// Models we can plot: a real conversion + exactly three channels + a ctor.
	const FAMILY_LABEL: Record<string, string> = {
		'perceptual-cylindrical': 'Perceptual cylindrical',
		lab: 'Lab family',
		hue: 'Hue family',
		rgb: 'RGB family',
		tristimulus: 'Tristimulus',
		video: 'Video / broadcast',
		subtractive: 'Subtractive'
	};
	const FAMILY_ORDER = ['perceptual-cylindrical', 'lab', 'hue', 'rgb', 'tristimulus', 'video', 'subtractive'];
	const pickable = allModels().filter(
		(m) => m.backed && m.ctor && m.channels.length === 3 && m.family !== 'system' && m.family !== 'other'
	);
	const grouped = FAMILY_ORDER.map((f) => ({
		label: FAMILY_LABEL[f] ?? f,
		models: pickable.filter((m) => m.family === f).sort((a, b) => a.label.localeCompare(b.label))
	})).filter((g) => g.models.length);

	let modelId = $state('oklch');
	let vals = $state<number[]>([0.7, 0.15, 250]);
	let yaw = $state(-0.6);
	let pitch = $state(0.45);
	let canvas: HTMLCanvasElement | undefined = $state();
	let dragging = false;
	let lastX = 0;
	let lastY = 0;

	const def = $derived(getModel(modelId) as ModelDef);

	/** Put a lightness-like channel on the vertical axis; others on x/z. */
	function axes(d: ModelDef): [number, number, number] {
		const li = d.channels.findIndex(
			(c) => /light|lumin|value|tone|bright|intens/i.test(c.label) || /^(l|j|i|t|v|p)$/i.test(c.localKey)
		);
		if (li < 0) return [0, 1, 2];
		const rest = [0, 1, 2].filter((i) => i !== li);
		return [rest[0], li, rest[1]];
	}

	// Re-seed the sliders whenever the model changes.
	let lastModel = '';
	$effect(() => {
		if (modelId === lastModel) return;
		lastModel = modelId;
		try {
			const c = hex(seed);
			vals = def.channels.map((ch) => c.channel(ch.key));
		} catch {
			vals = def.channels.map((ch) => (ch.range[0] + ch.range[1]) / 2);
		}
	});

	const current = $derived.by(() => {
		try {
			return ColorValue.from(def.ctor!.build(vals));
		} catch {
			return null;
		}
	});
	const curHex = $derived(current?.hex ?? '#000000');
	const inGamut = $derived(current?.inGamut ?? false);

	const N = 7;
	const samples = $derived.by(() => {
		const d = def;
		const chs = d.channels;
		const grid = (ci: number) => {
			const [lo, hi] = chs[ci].range;
			return Array.from({ length: N }, (_, k) => lo + ((hi - lo) * k) / (N - 1));
		};
		const norm = (ci: number, v: number) => {
			const [lo, hi] = chs[ci].range;
			return hi === lo ? 0 : (v - lo) / (hi - lo) - 0.5;
		};
		const [xi, yi, zi] = axes(d);
		const out: { x: number; y: number; z: number; hex: string; inG: boolean }[] = [];
		const g0 = grid(0), g1 = grid(1), g2 = grid(2);
		for (const v0 of g0)
			for (const v1 of g1)
				for (const v2 of g2) {
					const v = [v0, v1, v2];
					try {
						const cv = ColorValue.from(d.ctor!.build(v));
						out.push({ x: norm(xi, v[xi]), y: norm(yi, v[yi]), z: norm(zi, v[zi]), hex: cv.hex, inG: cv.inGamut });
					} catch {
						/* skip invalid */
					}
				}
		return out;
	});

	function draw() {
		const cv = canvas;
		if (!cv) return;
		const ctx = cv.getContext('2d');
		if (!ctx) return;
		const dpr = window.devicePixelRatio || 1;
		const w = cv.clientWidth || 320;
		const h = cv.clientHeight || 320;
		cv.width = w * dpr;
		cv.height = h * dpr;
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		ctx.clearRect(0, 0, w, h);
		const cx = w / 2, cy = h / 2, scale = Math.min(w, h) * 0.58;
		const cosY = Math.cos(yaw), sinY = Math.sin(yaw), cosX = Math.cos(pitch), sinX = Math.sin(pitch);
		const project = (px: number, py: number, pz: number) => {
			const x1 = px * cosY - pz * sinY;
			const z1 = px * sinY + pz * cosY;
			const y2 = py * cosX - z1 * sinX;
			const z2 = py * sinX + z1 * cosX;
			return { sx: cx + x1 * scale, sy: cy - y2 * scale, depth: z2 };
		};
		const grid = ui.theme === 'dark' ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.14)';
		const txt = ui.theme === 'dark' ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)';
		const [xi, yi, zi] = axes(def);
		// axis lines + labels
		const axisDefs: [number, number, number, string][] = [
			[1, 0, 0, def.channels[xi].localKey],
			[0, 1, 0, def.channels[yi].localKey],
			[0, 0, 1, def.channels[zi].localKey]
		];
		ctx.lineWidth = 1;
		ctx.font = '600 10px ui-monospace, monospace';
		for (const [ax, ay, az, label] of axisDefs) {
			const a = project(-ax * 0.5, -ay * 0.5, -az * 0.5);
			const b = project(ax * 0.5, ay * 0.5, az * 0.5);
			ctx.strokeStyle = grid;
			ctx.beginPath();
			ctx.moveTo(a.sx, a.sy);
			ctx.lineTo(b.sx, b.sy);
			ctx.stroke();
			ctx.fillStyle = txt;
			ctx.fillText('.' + label, b.sx + 3, b.sy + 3);
		}
		// points, back-to-front
		const proj = samples
			.map((p) => ({ ...project(p.x, p.y, p.z), hex: p.hex, inG: p.inG }))
			.sort((a, b) => a.depth - b.depth);
		for (const p of proj) {
			ctx.globalAlpha = p.inG ? 1 : 0.1;
			ctx.fillStyle = p.hex;
			ctx.beginPath();
			ctx.arc(p.sx, p.sy, p.inG ? 4.5 : 3, 0, 6.2832);
			ctx.fill();
		}
		ctx.globalAlpha = 1;
		// current marker
		const norm = (ci: number, v: number) => {
			const [lo, hi] = def.channels[ci].range;
			return hi === lo ? 0 : (v - lo) / (hi - lo) - 0.5;
		};
		const m = project(norm(xi, vals[xi]), norm(yi, vals[yi]), norm(zi, vals[zi]));
		ctx.beginPath();
		ctx.arc(m.sx, m.sy, 9, 0, 6.2832);
		ctx.fillStyle = curHex;
		ctx.fill();
		ctx.lineWidth = 2.5;
		ctx.strokeStyle = ui.theme === 'dark' ? '#fff' : '#000';
		ctx.stroke();
	}

	$effect(() => {
		// track deps then draw
		void samples;
		void vals;
		void yaw;
		void pitch;
		void curHex;
		void ui.theme;
		draw();
	});

	function onDown(e: PointerEvent) {
		dragging = true;
		lastX = e.clientX;
		lastY = e.clientY;
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
	}
	function onMove(e: PointerEvent) {
		if (!dragging) return;
		yaw += (e.clientX - lastX) * 0.01;
		pitch = Math.max(-1.4, Math.min(1.4, pitch + (e.clientY - lastY) * 0.01));
		lastX = e.clientX;
		lastY = e.clientY;
	}
	function onUp() {
		dragging = false;
	}
</script>

<div class="mv">
	<div class="mv-controls">
		<label class="mv-select">
			<span>Model</span>
			<select class="select" bind:value={modelId}>
				{#each grouped as g (g.label)}
					<optgroup label={g.label}>
						{#each g.models as m (m.id)}
							<option value={m.id}>{m.label}</option>
						{/each}
					</optgroup>
				{/each}
			</select>
		</label>

		{#if MODEL_DOCS[modelId]?.about}
			<p class="mv-about">{MODEL_DOCS[modelId]?.about}</p>
		{/if}

		<div class="mv-sliders">
			{#each def.channels as ch, i (ch.key)}
				<div class="mv-slider">
					<div class="mv-slabel">
						<code>.{ch.localKey}</code>
						<span class="mv-chname">{ch.label}</span>
						<span class="mv-val">{+vals[i]?.toFixed(ch.range[1] - ch.range[0] <= 2 ? 3 : 1)}</span>
					</div>
					<input
						type="range"
						min={ch.range[0]}
						max={ch.range[1]}
						step={(ch.range[1] - ch.range[0]) / 240}
						bind:value={vals[i]}
					/>
					<div class="mv-range">
						<span>{+ch.range[0].toFixed(2)}</span><span>{+ch.range[1].toFixed(2)}</span>
					</div>
				</div>
			{/each}
		</div>

		<div class="mv-result">
			<span class="mv-swatch" style="background:{curHex}"></span>
			<code>{curHex}</code>
			{#if !inGamut}<span class="mv-oog">out of sRGB</span>{/if}
		</div>
	</div>

	<div class="mv-canvas-wrap">
		<canvas
			bind:this={canvas}
			onpointerdown={onDown}
			onpointermove={onMove}
			onpointerup={onUp}
			onpointercancel={onUp}
		></canvas>
		<span class="mv-hint">drag to rotate · faint dots are out of gamut</span>
	</div>
</div>

<style>
	.mv {
		display: grid;
		grid-template-columns: minmax(220px, 300px) 1fr;
		gap: 14px;
		height: 100%;
		min-height: 0;
		padding: 12px;
	}
	.mv-controls {
		display: flex;
		flex-direction: column;
		gap: 12px;
		min-width: 0;
		overflow-y: auto;
	}
	.mv-select {
		display: grid;
		gap: 4px;
	}
	.mv-select span {
		font-size: 10px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--text-faint);
	}
	.mv-about {
		margin: 0;
		font-size: 11.5px;
		line-height: 1.5;
		color: var(--text-muted);
	}
	.mv-sliders {
		display: grid;
		gap: 12px;
	}
	.mv-slider {
		display: grid;
		gap: 3px;
	}
	.mv-slabel {
		display: flex;
		align-items: baseline;
		gap: 6px;
		font-size: 11px;
	}
	.mv-slabel code {
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		color: var(--syn-prop);
		font-weight: 600;
	}
	.mv-chname {
		color: var(--text-muted);
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.mv-val {
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		color: var(--text);
		font-weight: 600;
	}
	.mv-slider input[type='range'] {
		width: 100%;
		accent-color: var(--accent);
	}
	.mv-range {
		display: flex;
		justify-content: space-between;
		font-size: 9px;
		color: var(--text-faint);
		font-family: 'JetBrains Mono', ui-monospace, monospace;
	}
	.mv-result {
		display: flex;
		align-items: center;
		gap: 8px;
		padding-top: 4px;
	}
	.mv-swatch {
		width: 26px;
		height: 26px;
		border-radius: var(--radius-xs);
		border: 1px solid var(--border);
	}
	.mv-result code {
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		font-size: 13px;
		font-weight: 600;
	}
	.mv-oog {
		font-size: 9.5px;
		color: var(--warn);
		border: 1px solid color-mix(in srgb, var(--warn) 40%, transparent);
		border-radius: 99px;
		padding: 0 6px;
	}
	.mv-canvas-wrap {
		position: relative;
		min-height: 0;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface-2);
		overflow: hidden;
	}
	.mv-canvas-wrap canvas {
		width: 100%;
		height: 100%;
		display: block;
		touch-action: none;
		cursor: grab;
	}
	.mv-canvas-wrap canvas:active {
		cursor: grabbing;
	}
	.mv-hint {
		position: absolute;
		left: 10px;
		bottom: 8px;
		font-size: 10px;
		color: var(--text-faint);
		pointer-events: none;
	}
	@media (max-width: 720px) {
		.mv {
			grid-template-columns: 1fr;
		}
		.mv-canvas-wrap {
			min-height: 280px;
		}
	}
</style>
