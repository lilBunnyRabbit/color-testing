import type { ColorGroup } from '$lib/oklch';

const groups: ColorGroup[] = [
	{
		label: 'Base',
		colors: [
			['background', 'rgb(26, 43, 51)'],
			['foreground', 'rgb(185, 182, 170)'],
		]
	},
	{
		label: 'Brand',
		colors: [
			['primary', 'rgb(237, 203, 171)'],
		]
	},
	{
		label: 'Semantic',
		colors: [
			['info', 'rgb(171, 237, 231)'],
			['success', 'rgb(206, 237, 171)'],
			['warning', 'rgb(237, 219, 171)'],
			['error', 'rgb(237, 171, 171)'],
		]
	},
];

export default groups;
