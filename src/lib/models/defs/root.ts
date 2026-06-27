/**
 * The root "model" — value-level flat shortcuts (c.lighten, c.rotate, c.hex…).
 * These preserve the legacy `Color` API exactly so existing DSL scripts stay
 * byte-identical after the swap. All operate in OKLCH.
 */
import { register, defineModel, clampChroma, wcagContrast } from '../registry';
import { ColorValue, type PlainObject } from '../value';
import { method, accessor, makeOklch, wrapHue, num, color, obj, optNum, oklchMix, p } from '../util';

const L = (c: ColorValue) => c.channel('ok_l');
const C = (c: ColorValue) => c.channel('ok_c');
const H = (c: ColorValue) => c.channel('ok_h');

register(
	defineModel({
		id: 'root',
		label: 'Color',
		family: 'root',
		channels: [],
		ownMethods: [
			method('lighten', [p('amount')], 'color', 'Increase OKLCH lightness', (self, [a]) =>
				ColorValue.from(makeOklch(L(self) + num(a), C(self), H(self)))
			),
			method('darken', [p('amount')], 'color', 'Decrease OKLCH lightness', (self, [a]) =>
				ColorValue.from(makeOklch(L(self) - num(a), C(self), H(self)))
			),
			method('saturate', [p('amount')], 'color', 'Increase OKLCH chroma', (self, [a]) =>
				ColorValue.from(makeOklch(L(self), C(self) + num(a), H(self)))
			),
			method('desaturate', [p('amount')], 'color', 'Decrease OKLCH chroma', (self, [a]) =>
				ColorValue.from(makeOklch(L(self), C(self) - num(a), H(self)))
			),
			method('rotate', [p('degrees')], 'color', 'Shift OKLCH hue', (self, [d]) =>
				ColorValue.from(makeOklch(L(self), C(self), wrapHue(H(self) + num(d))))
			),
			method('invert', [], 'color', 'Flip lightness and rotate hue 180°', (self) =>
				ColorValue.from(makeOklch(1 - L(self), C(self), wrapHue(H(self) + 180)))
			),
			method('complement', [], 'color', 'Rotate OKLCH hue 180°', (self) =>
				ColorValue.from(makeOklch(L(self), C(self), wrapHue(H(self) + 180)))
			),
			method(
				'mix',
				[p('other', 'color'), p('ratio', 'number', { optional: true })],
				'color',
				'Blend in OKLCH (shortest-arc hue), ratio 0–1 (default 0.5)',
				(self, [o, r]) => oklchMix(self, color(o), r === undefined ? 0.5 : num(r))
			),
			method(
				'shift',
				[p('deltas', 'object')],
				'color',
				'Add deltas to OKLCH channels: { l?, c?, h? }',
				(self, [d]) => {
					const o = obj(d) as PlainObject;
					return ColorValue.from(
						makeOklch(
							L(self) + (optNum(o, 'l') ?? 0),
							C(self) + (optNum(o, 'c') ?? 0),
							wrapHue(H(self) + (optNum(o, 'h') ?? 0))
						)
					);
				}
			),
			method(
				'derive',
				[p('overrides', 'object')],
				'color',
				'Replace OKLCH channels: { l?, c?, h? }',
				(self, [d]) => {
					const o = obj(d) as PlainObject;
					return ColorValue.from(
						makeOklch(optNum(o, 'l') ?? L(self), optNum(o, 'c') ?? C(self), optNum(o, 'h') ?? H(self))
					);
				}
			),
			method('contrast', [p('other', 'color')], 'number', 'WCAG contrast ratio', (self, [o]) =>
				wcagContrast(self.project('oklch'), color(o).project('oklch'))
			),
			accessor('hex', 'string', 'Hex string "#rrggbb"', (self) => self.hex),
			accessor('inGamut', 'boolean', 'Displayable in sRGB', (self) => self.inGamut),
			accessor('inP3', 'boolean', 'Displayable in Display P3', (self) => self.inP3),
			accessor('gamutMapped', 'color', 'Chroma-clamped into sRGB', (self) =>
				ColorValue.from(clampChroma(self.project('oklch'), 'oklch'))
			)
		]
	})
);
