/** CMYK — process-ink subtractive. Not culori-backed; the package boundary. */
import { register, defineModel, type CuloriColor } from '../registry';
import { method, unbacked, p } from '../util';

register(
	defineModel({
		id: 'cmyk',
		label: 'CMYK',
		family: 'subtractive',
		backed: false,
		ctor: {
			name: 'CMYK',
			params: [p('c'), p('m'), p('y'), p('k')],
			build: () => unbacked('CMYK') as unknown as CuloriColor
		},
		ownMethods: [
			method('separations', [], 'colors', 'Per-ink separations', () => unbacked('CMYK')),
			method('totalInk', [], 'number', 'Total ink coverage (%)', () => unbacked('CMYK'))
		]
	})
);
