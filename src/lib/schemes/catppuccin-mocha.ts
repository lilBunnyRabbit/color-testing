// Catppuccin Mocha — MIT License
// https://github.com/catppuccin/catppuccin

import type { ColorGroup } from '$lib/oklch';

const groups: ColorGroup[] = [
	{
		label: 'Base',
		colors: [
			['crust', '#11111b'],
			['mantle', '#181825'],
			['base', '#1e1e2e'],
		]
	},
	{
		label: 'Surface',
		colors: [
			['surface-0', '#313244'],
			['surface-1', '#45475a'],
			['surface-2', '#585b70'],
		]
	},
	{
		label: 'Overlay',
		colors: [
			['overlay-0', '#6c7086'],
			['overlay-1', '#7f849c'],
			['overlay-2', '#9399b2'],
		]
	},
	{
		label: 'Text',
		colors: [
			['subtext-0', '#a6adc8'],
			['subtext-1', '#bac2de'],
			['text', '#cdd6f4'],
		]
	},
	{
		label: 'Accent',
		colors: [
			['rosewater', '#f5e0dc'],
			['flamingo', '#f2cdcd'],
			['pink', '#f5c2e7'],
			['mauve', '#cba6f7'],
			['red', '#f38ba8'],
			['maroon', '#eba0ac'],
			['peach', '#fab387'],
			['yellow', '#f9e2af'],
			['green', '#a6e3a1'],
			['teal', '#94e2d5'],
			['sky', '#89dceb'],
			['sapphire', '#74c7ec'],
			['blue', '#89b4fa'],
			['lavender', '#b4befe'],
		]
	},
];

export default groups;
