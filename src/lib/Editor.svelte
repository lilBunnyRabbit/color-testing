<script lang="ts">
	import { onMount } from 'svelte';
	import { EditorView, keymap, lineNumbers, drawSelection, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view';
	import { EditorState } from '@codemirror/state';
	import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
	import { syntaxHighlighting, bracketMatching } from '@codemirror/language';
	import { HighlightStyle } from '@codemirror/language';
	import { tags } from '@lezer/highlight';
	import { chromaDSL } from '$lib/dsl/lang.js';

	let {
		value = $bindable(''),
		onchange
	}: {
		value: string;
		onchange?: (value: string) => void;
	} = $props();

	let container: HTMLDivElement;
	let view: EditorView;

	const theme = EditorView.theme({
		'&': {
			height: '100%',
			fontSize: '13px'
		},
		'.cm-content': {
			fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
			padding: '16px 0',
			caretColor: '#c8c8d0'
		},
		'.cm-line': {
			padding: '0 16px'
		},
		'.cm-gutters': {
			backgroundColor: 'transparent',
			color: '#3a3a44',
			border: 'none',
			paddingLeft: '8px'
		},
		'.cm-activeLineGutter': {
			backgroundColor: 'transparent',
			color: '#6a6a78'
		},
		'.cm-activeLine': {
			backgroundColor: '#ffffff06'
		},
		'.cm-cursor': {
			borderLeftColor: '#c8c8d0'
		},
		'.cm-selectionBackground': {
			backgroundColor: '#364a6d66 !important'
		},
		'&.cm-focused .cm-selectionBackground': {
			backgroundColor: '#364a6d88 !important'
		},
		'.cm-matchingBracket': {
			backgroundColor: '#ffffff15',
			outline: 'none'
		}
	}, { dark: true });

	const highlight = syntaxHighlighting(
		HighlightStyle.define([
			{ tag: tags.variableName, color: '#c8c8d0' },
			{ tag: tags.function(tags.variableName), color: '#b4a0e5' },
			{ tag: tags.typeName, color: '#e5c07b' },
			{ tag: tags.propertyName, color: '#7ec8e3' },
			{ tag: tags.function(tags.propertyName), color: '#61c9a8' },
			{ tag: tags.number, color: '#d19a66' },
			{ tag: tags.string, color: '#98c379' },
			{ tag: tags.bool, color: '#d19a66' },
			{ tag: tags.operator, color: '#8888a0' },
			{ tag: tags.punctuation, color: '#666680' },
			{ tag: tags.lineComment, color: '#555566', fontStyle: 'italic' },
		])
	);

	const updateListener = EditorView.updateListener.of((update) => {
		if (update.docChanged) {
			const newValue = update.state.doc.toString();
			value = newValue;
			onchange?.(newValue);
		}
	});

	onMount(() => {
		view = new EditorView({
			state: EditorState.create({
				doc: value,
				extensions: [
					lineNumbers(),
					history(),
					drawSelection(),
					bracketMatching(),
					highlightActiveLine(),
					highlightActiveLineGutter(),
					keymap.of([...defaultKeymap, ...historyKeymap]),
					chromaDSL,
					theme,
					highlight,
					updateListener,
				]
			}),
			parent: container
		});

		return () => view.destroy();
	});

	// Sync external value changes back to CodeMirror
	$effect(() => {
		if (view && value !== view.state.doc.toString()) {
			view.dispatch({
				changes: { from: 0, to: view.state.doc.length, insert: value }
			});
		}
	});
</script>

<div bind:this={container} class="h-full"></div>
