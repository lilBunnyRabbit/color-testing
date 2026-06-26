/** Oklab — perceptual rectangular. The default mix() space (matches CSS color-mix) + fast ΔE. */
import { register, defineModel, differenceEuclidean, type CuloriColor } from '../registry';
import { ColorValue } from '../value';
import { method, lerpInMode, color, num, p } from '../util';

register(
	defineModel({
		id: 'oklab',
		label: 'Oklab',
		family: 'lab',
		priority: 'critical',
		ctor: {
			name: 'OKLAB',
			params: [p('l'), p('a'), p('b')],
			build: ([l, a, b]) => ({ mode: 'oklab', l, a, b }) as unknown as CuloriColor
		},
		channels: [
			{ key: 'oklab_l', localKey: 'l', label: 'Lightness', culoriField: 'l', range: [0, 1] },
			{ key: 'oklab_a', localKey: 'a', label: 'a', culoriField: 'a', range: [-0.4, 0.4] },
			{ key: 'oklab_b', localKey: 'b', label: 'b', culoriField: 'b', range: [-0.4, 0.4] }
		],
		ownMethods: [
			method(
				'mix',
				[p('other', 'color'), p('ratio', 'number', { optional: true })],
				'color',
				'Perceptual blend in Oklab (the CSS color-mix default)',
				(self, [o, r]) => lerpInMode(self, color(o), 'oklab', r === undefined ? 0.5 : num(r))
			),
			method(
				'deltaEok',
				[p('other', 'color')],
				'number',
				'Euclidean Oklab color difference (fast perceptual ΔE)',
				(self, [o]) => differenceEuclidean('oklab')(self.project('oklab'), color(o).project('oklab'))
			)
		]
	})
);
