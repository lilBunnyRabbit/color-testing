<script lang="ts">
	import { manifest } from '$lib/dsl/manifest';

	let { onclose }: { onclose?: () => void } = $props();

	const FAMILY_LABEL: Record<string, string> = {
		root: 'Value shortcuts',
		'perceptual-cylindrical': 'Perceptual cylindrical',
		lab: 'Lab family (ΔE)',
		hue: 'Hue family',
		rgb: 'RGB family (a11y · CVD)',
		subtractive: 'Subtractive'
	};
	const FAMILY_ORDER = ['root', 'perceptual-cylindrical', 'lab', 'hue', 'rgb', 'subtractive'];

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
		background: rgba(14, 14, 16, 0.96);
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
		color: #c8c8d0;
	}
	.docs-sub {
		font-size: 11px;
		color: #555;
		margin-right: auto;
	}
	.docs-close {
		padding: 3px 10px;
		border: 1px solid #2a2a30;
		border-radius: 4px;
		background: none;
		color: #888;
		font-size: 12px;
		cursor: pointer;
	}
	.docs-close:hover {
		color: #ddd;
		border-color: #555;
	}
	.docs-section {
		font-size: 11px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: #8888a0;
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
		color: #555;
	}
	.docs-view {
		font-family: monospace;
		font-size: 11px;
		color: #61c9a8;
	}
	.docs-badge {
		font-size: 9px;
		color: #d19a66;
		border: 1px solid #5a4630;
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
		color: #555;
		font-size: 11px;
	}
	.t-ctor {
		color: #e5c07b;
	}
	.t-fn {
		color: #b4a0e5;
		margin-right: 8px;
	}
	.t-method {
		color: #61c9a8;
	}
	.t-prop {
		color: #7ec8e3;
	}
	.t-ret {
		color: #555;
	}
	.t-dim {
		color: #666;
	}
	.t-stub {
		opacity: 0.5;
	}
</style>
