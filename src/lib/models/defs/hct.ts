/** HCT (Material) — tonal palettes / Material 3 roles. Not yet backed. */
import { register, defineModel, type CuloriColor } from '../registry';
import { method, unbacked, p } from '../util';

register(
	defineModel({
		id: 'hct',
		label: 'HCT (Material)',
		family: 'perceptual-cylindrical',
		backed: false,
		ctor: {
			name: 'HCT',
			params: [p('h'), p('c'), p('t')],
			build: () => unbacked('HCT') as unknown as CuloriColor
		},
		ownMethods: [
			method('tonalPalette', [p('tones', 'object', { optional: true })], 'colors', 'Material tonal palette', () =>
				unbacked('HCT')
			),
			method('materialRoles', [], 'colors', 'Material 3 role set', () => unbacked('HCT'))
		]
	})
);
