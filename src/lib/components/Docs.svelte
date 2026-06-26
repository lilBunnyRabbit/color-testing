<script lang="ts">
	import { manifest } from '$lib/dsl/manifest';

	let { onclose }: { onclose?: () => void } = $props();

	const FAMILY_LABEL: Record<string, string> = {
		root: 'Value shortcuts',
		'perceptual-cylindrical': 'Perceptual cylindrical',
		lab: 'Lab family (ΔE)',
		hue: 'Hue family',
		rgb: 'RGB family (a11y · CVD)',
		tristimulus: 'Tristimulus',
		subtractive: 'Subtractive',
		video: 'Video / broadcast',
		system: 'Color systems'
	};
	const FAMILY_ORDER = [
		'root',
		'perceptual-cylindrical',
		'lab',
		'hue',
		'rgb',
		'tristimulus',
		'video',
		'subtractive',
		'system'
	];

	const models = [...manifest.models].sort(
		(a, b) => FAMILY_ORDER.indexOf(a.family) - FAMILY_ORDER.indexOf(b.family)
	);

	function methodsOf(m: (typeof models)[number]) {
		return Array.from(m.methods.values());
	}
</script>

<div class="docs-overlay">
	<div class="docs-panel">
		<header class="docs-header">
			<h2 class="docs-title">DSL Reference</h2>
			<span class="docs-sub">{manifest.models.length} models · generated from the registry</span>
			<button class="docs-close" onclick={() => onclose?.()}>Close</button>
		</header>

		<div class="docs-body">
			<section>
				<h3 class="docs-section">Constructors</h3>
				<div class="docs-mono">
					{#each manifest.constructors as c (c.name)}
						<div>
							<span class="t-ctor">{c.name}</span><span class="t-dim"
								>({c.params.map((p) => p.name).join(', ')})</span
							> <span class="t-ret">→ color</span>
						</div>
					{/each}
				</div>
			</section>

			<section>
				<h3 class="docs-section">Functions</h3>
				<div class="docs-mono">
					{#each manifest.builtins as b (b)}<span class="t-fn">{b}</span> {/each}
				</div>
			</section>

			{#each models as m (m.id)}
				<section>
					<h3 class="docs-section">
						<span class:t-stub={!m.backed}>{m.label}</span>
						<span class="docs-family">{FAMILY_LABEL[m.family] ?? m.family}</span>
						{#if m.id !== 'root'}<span class="docs-view">.{m.id}</span>{/if}
						{#if !m.backed}<span class="docs-badge">needs package</span>{/if}
					</h3>
					{#if m.channels.length}
						<div class="docs-mono docs-channels">
							{#each m.channels as ch (ch.localKey)}
								<span class="t-prop">.{ch.localKey}</span><span class="t-dim"> {ch.label}</span>
							{/each}
						</div>
					{/if}
					<div class="docs-mono">
						{#each methodsOf(m) as def (def.name)}
							<div class="docs-method">
								<span class={def.kind === 'method' ? 't-method' : 't-prop'}>.{def.name}</span>
								<span class="t-dim"
									>{def.kind === 'method'
										? `(${def.params.map((p) => p.name + (p.optional ? '?' : '')).join(', ')}) → ${def.returns}`
										: `→ ${def.returns}`}</span
								>
								<span class="docs-doc">{def.doc}</span>
							</div>
						{/each}
					</div>
				</section>
			{/each}
		</div>
	</div>
</div>

<style>
	.docs-overlay {
		position: absolute;
		inset: 0;
		background: color-mix(in srgb, var(--surface) 94%, transparent);
		backdrop-filter: blur(4px);
		overflow-y: auto;
		z-index: 40;
	}
	.docs-panel {
		max-width: 640px;
		margin: 0 auto;
		padding: 20px;
	}
	.docs-header {
		display: flex;
		align-items: baseline;
		gap: 10px;
		margin-bottom: 16px;
	}
	.docs-title {
		font-size: 14px;
		font-weight: 700;
		letter-spacing: 0.04em;
		color: var(--text);
	}
	.docs-sub {
		font-size: 11px;
		color: var(--text-faint);
		margin-right: auto;
	}
	.docs-close {
		padding: 3px 10px;
		border: 1px solid var(--border);
		border-radius: 4px;
		background: none;
		color: var(--text-muted);
		font-size: 12px;
		cursor: pointer;
	}
	.docs-close:hover {
		color: var(--text);
		border-color: var(--text-faint);
	}
	.docs-section {
		font-size: 11px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--text-faint);
		margin: 18px 0 6px;
		display: flex;
		align-items: baseline;
		gap: 8px;
	}
	.docs-family {
		font-size: 10px;
		font-weight: 500;
		text-transform: none;
		letter-spacing: 0;
		color: var(--text-faint);
	}
	.docs-view {
		font-family: monospace;
		font-size: 11px;
		color: var(--syn-method);
	}
	.docs-badge {
		font-size: 9px;
		color: var(--syn-num);
		border: 1px solid var(--border-strong);
		border-radius: 3px;
		padding: 0 4px;
	}
	.docs-mono {
		font-family: ui-monospace, Menlo, monospace;
		font-size: 12px;
		line-height: 1.7;
	}
	.docs-channels {
		margin-bottom: 6px;
	}
	.docs-method {
		display: flex;
		gap: 8px;
		align-items: baseline;
		flex-wrap: wrap;
	}
	.docs-doc {
		color: var(--text-faint);
		font-size: 11px;
	}
	.t-ctor {
		color: var(--syn-type);
	}
	.t-fn {
		color: var(--syn-fn);
		margin-right: 8px;
	}
	.t-method {
		color: var(--syn-method);
	}
	.t-prop {
		color: var(--syn-prop);
	}
	.t-ret {
		color: var(--text-faint);
	}
	.t-dim {
		color: var(--text-faint);
	}
	.t-stub {
		opacity: 0.5;
	}
</style>
