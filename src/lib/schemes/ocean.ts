import { OKLCH, type ColorGroup } from '$lib/oklch';

const background = new OKLCH('background', 0.92, 0.015, 85, 'Source (warm off-white)');

const foreground = new OKLCH(
	'foreground',
	0.25,
	background.c * 2,
	background.h + 10,
	'0.25, $background.c * 2, $background.h + 10'
);

const primary = new OKLCH(
	'primary',
	0.55,
	0.18,
	155,
	'0.55, 0.18, 155 (teal)'
);

const groups: ColorGroup[] = [
	{
		label: 'Background',
		colors: [
			background.shift('bg-lightest', { l: 0.05 },
				'$background.l + 0.05, $background.c, $background.h'),
			background,
			background.shift('bg-darker', { l: -0.05, c: 0.005 },
				'$background.l - 0.05, $background.c + 0.005, $background.h'),
			background.shift('bg-darkest', { l: -0.12, c: 0.01 },
				'$background.l - 0.12, $background.c + 0.01, $background.h'),
		]
	},
	{
		label: 'Core',
		colors: [
			foreground,
			foreground.shift('fg-muted', { l: 0.2 },
				'$foreground.l + 0.2 (muted)'),
			primary,
			primary.derive('secondary', { h: 280, c: 0.14 },
				'$primary.l, 0.14, 280 (purple)'),
			primary.derive('accent', { h: 45, c: 0.16, l: 0.65 },
				'0.65, 0.16, 45 (warm orange)'),
		]
	},
	{
		label: 'Semantic',
		colors: [
			new OKLCH('success', 0.6, 0.17, 145, '0.6, 0.17, 145 (green)'),
			new OKLCH('warning', 0.7, 0.16, 65, '0.7, 0.16, 65 (amber)'),
			new OKLCH('error', 0.6, 0.2, 20, '0.6, 0.2, 20 (red)'),
			new OKLCH('info', 0.6, 0.14, 240, '0.6, 0.14, 240 (blue)'),
		]
	},
	{
		label: 'Triad',
		colors: [
			primary.shift('triad-a', { h: 120 },
				'$primary.l, $primary.c, $primary.h + 120 (triad)'),
			primary.shift('triad-b', { h: -120 + 360 },
				'$primary.l, $primary.c, $primary.h - 120 (triad)'),
		]
	},
];

export default groups;
