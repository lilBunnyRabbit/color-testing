<script lang="ts">
	import Editor from '$lib/Editor.svelte';
	import Inspector from '$lib/components/Inspector.svelte';
	import Matrix from '$lib/components/Matrix.svelte';
	import Preview from '$lib/components/Preview.svelte';
	import Docs from '$lib/components/Docs.svelte';
	import { app } from '$lib/state/app.svelte';
	import { chromaCompletions } from '$lib/dsl/complete';
	import { examples } from './examples';

	const completion = chromaCompletions(() => app.result.order);
	let showDocs = $state(false);

	const EXAMPLES: Record<string, string> = Object.fromEntries(
		examples.map((e) => [e.name, e.source])
	);
	const exampleNames = examples.map((e) => e.name);

	let currentExample = $state(exampleNames[0]);
	if (app.source === '') app.source = examples[0].source;

	type Tab = 'inspector' | 'matrix' | 'preview';
	let tab = $state<Tab>('inspector');
</script>

<svelte:head>
	<title>Chromatics</title>
</svelte:head>

<div class="flex h-screen bg-[#0e0e10] text-[#c8c8d0]">
	<!-- Author panel -->
	<div class="flex w-1/2 flex-col border-r border-[#2a2a30]">
		<div class="flex items-center gap-2 border-b border-[#2a2a30] px-4 py-2">
			<h1 class="text-sm font-semibold tracking-wide text-[#8888a0]">EDITOR</h1>
			<select
				class="rounded bg-[#18181b] px-2 py-0.5 text-xs text-[#8888a0] outline-none"
				bind:value={currentExample}
				onchange={() => (app.source = EXAMPLES[currentExample])}
			>
				{#each exampleNames as name (name)}
					<option value={name}>{name}</option>
				{/each}
			</select>
			{#if app.result.errors.length > 0}
				<span class="rounded bg-red-900/40 px-2 py-0.5 text-xs text-red-400">
					{app.result.errors.length} error{app.result.errors.length > 1 ? 's' : ''}
				</span>
			{/if}
			<div class="flex-1"></div>
			<button
				class="rounded px-2 py-0.5 text-xs transition-colors hover:bg-[#2a2a30] hover:text-[#c8c8d0] {showDocs
					? 'bg-[#2a2a30] text-[#c8c8d0]'
					: 'text-[#8888a0]'}"
				onclick={() => (showDocs = !showDocs)}>API</button
			>
		</div>

		<div class="relative flex-1 overflow-hidden">
			<Editor bind:value={app.source} completionSource={completion} />
			{#if showDocs}
				<Docs onclose={() => (showDocs = false)} />
			{/if}
		</div>

		{#if app.result.errors.length > 0}
			<div class="max-h-32 overflow-y-auto border-t border-[#2a2a30] bg-red-950/20 px-4 py-2">
				{#each app.result.errors as err (err.line + err.message)}
					<div class="flex gap-2 text-xs">
						<span class="text-red-500">line {err.line}:</span>
						<span class="text-red-400">{err.message}</span>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Analyze panel -->
	<div class="flex w-1/2 flex-col">
		<div class="flex items-center gap-1 border-b border-[#2a2a30] px-2 py-1.5">
			<button
				class="rounded px-3 py-1 text-xs font-medium transition-colors {tab === 'inspector'
					? 'bg-[#2a2a30] text-[#e4e4e8]'
					: 'text-[#8888a0] hover:text-[#c8c8d0]'}"
				onclick={() => (tab = 'inspector')}>Inspector</button
			>
			<button
				class="rounded px-3 py-1 text-xs font-medium transition-colors {tab === 'matrix'
					? 'bg-[#2a2a30] text-[#e4e4e8]'
					: 'text-[#8888a0] hover:text-[#c8c8d0]'}"
				onclick={() => (tab = 'matrix')}>Matrix</button
			>
			<button
				class="rounded px-3 py-1 text-xs font-medium transition-colors {tab === 'preview'
					? 'bg-[#2a2a30] text-[#e4e4e8]'
					: 'text-[#8888a0] hover:text-[#c8c8d0]'}"
				onclick={() => (tab = 'preview')}>Preview</button
			>
			<span class="ml-auto pr-2 text-xs text-[#555]">
				{app.scheme.entries.length} color{app.scheme.entries.length !== 1 ? 's' : ''}
			</span>
		</div>

		<div class="flex min-h-0 flex-1 flex-col overflow-hidden">
			{#if tab === 'inspector'}
				<Inspector scheme={app.scheme} />
			{:else if tab === 'matrix'}
				<Matrix />
			{:else}
				<Preview />
			{/if}
		</div>
	</div>
</div>
