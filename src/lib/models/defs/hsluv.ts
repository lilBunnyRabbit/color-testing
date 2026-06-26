/** HSLuv — perceptually-uniform HSL. Not culori-backed in the default build. */
import { register, defineModel, type CuloriColor } from '../registry';
import { method, unbacked, p } from '../util';

register(
	defineModel({
		id: 'hsluv',
		label: 'HSLuv',
		family: 'hue',
		backed: false,
		ctor: {
			name: 'HSLUV',
			params: [p('h'), p('s'), p('l')],
			build: () => unbacked('HSLuv') as unknown as CuloriColor
		},
		ownMethods: [
			method('rotateHue', [p('degrees')], 'color', 'Perceptually-uniform hue rotation', () =>
				unbacked('HSLuv')
			)
		]
	})
);
