/** UI/chrome state: theme, the resizable/collapsible editor, and the active tab. */
export type Theme = 'light' | 'dark';
export type Tab = 'inspector' | 'matrix' | 'preview' | 'explore' | 'export';

export class UiStore {
	theme = $state<Theme>('light');
	/** Editor pane width as a percentage of the window. */
	editorWidth = $state(46);
	editorCollapsed = $state(false);
	tab = $state<Tab>('inspector');

	toggleTheme() {
		this.theme = this.theme === 'light' ? 'dark' : 'light';
	}
}

export const ui = new UiStore();
