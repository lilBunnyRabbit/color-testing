/** UI/chrome state: theme, the resizable/collapsible editor, and the active tab. */
export type Theme = 'light' | 'dark';
export type Tab = 'inspector' | 'studio' | 'matrix' | 'validate' | 'preview' | 'explore' | 'export';

export class UiStore {
	theme = $state<Theme>('light');
	/** Editor pane width as a percentage of the window. */
	editorWidth = $state(46);
	editorCollapsed = $state(false);
	tab = $state<Tab>('inspector');

	/**
	 * Viewport gate for the desktop/mobile shell split. Both stay false during
	 * SSR/prerender and on the first client (hydration) render, so the prerendered
	 * markup is always the desktop shell — no hydration mismatch. They flip in
	 * +layout.svelte onMount once matchMedia can be read safely. See
	 * src/routes/+page.svelte for the mount-gated chooser.
	 */
	mounted = $state(false);
	isMobile = $state(false);

	toggleTheme() {
		this.theme = this.theme === 'light' ? 'dark' : 'light';
	}
}

export const ui = new UiStore();
