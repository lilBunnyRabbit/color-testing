import type { ColorGroup } from '$lib/oklch';

const groups: ColorGroup[] = [
	{
		label: 'Base',
		colors: [
			['background', 'rgb(255, 246, 231)'],
			['foreground', 'rgb(100, 128, 150)'],
		]
	},
	{
		label: 'Brand',
		colors: [
			['primary', 'rgb(219, 159, 118)'],
		]
	},
	{
		label: 'Semantic',
		colors: [
			['info', 'rgb(118, 197, 219)'],
			['success', 'rgb(172, 219, 118)'],
			['warning', 'rgb(219, 187, 118)'],
			['error', 'rgb(219, 118, 118)'],
		]
	},
];

export default groups;
