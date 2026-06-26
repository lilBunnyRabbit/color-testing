/** CIE XYZ (D65) — the tristimulus interchange hub. */
import { register, defineModel, type CuloriColor } from '../registry';
import { p } from '../util';

register(
	defineModel({
		id: 'xyz',
		mode: 'xyz65', // culori's D65 XYZ mode
		label: 'CIE XYZ',
		family: 'tristimulus',
		priority: 'critical',
		ctor: {
			name: 'XYZ',
			params: [p('x'), p('y'), p('z')],
			build: ([x, y, z]) => ({ mode: 'xyz65', x, y, z }) as unknown as CuloriColor
		},
		channels: [
			{ key: 'xyz_x', localKey: 'x', label: 'X', culoriField: 'x', range: [0, 1] },
			{ key: 'xyz_y', localKey: 'y', label: 'Y (luminance)', culoriField: 'y', range: [0, 1] },
			{ key: 'xyz_z', localKey: 'z', label: 'Z', culoriField: 'z', range: [0, 1] }
		]
	})
);
