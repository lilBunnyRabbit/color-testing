/**
 * Family op-tables — the encyclopedia's "method altitude" expressed as data.
 * Each table is spread into a ModelDef via `inherit`, so a method exists on a
 * family of models without any class inheritance.
 */
import { ColorValue } from './value';
import { num, str, color, makeOklch, wrapHue, method, accessor, p } from './util';
import {
	wcagContrast,
	wcagLuminance,
	filterDeficiencyProt,
	filterDeficiencyDeuter,
	filterDeficiencyTrit,
	filterGrayscale,
	differenceCiede2000,
	differenceCie76,
	differenceCie94,
	differenceCmc,
	type CuloriColor
} from './registry';
import type { MethodDef } from './types';

type HueKind = 'hue' | 'perceptual';

/** Rotate hue either naively (HSL) or perceptually (OKLCH). */
function rotated(self: ColorValue, deg: number, kind: HueKind): ColorValue {
	if (kind === 'perceptual') {
		return ColorValue.from(
			makeOklch(self.channel('ok_l'), self.channel('ok_c'), wrapHue(self.channel('ok_h') + deg))
		);
	}
	const h = self.project('hsl') as unknown as Record<string, number | undefined>;
	return ColorValue.from({
		mode: 'hsl',
		h: wrapHue((h.h ?? 0) + deg),
		s: h.s ?? 0,
		l: h.l ?? 0
	} as unknown as CuloriColor);
}

const tag = (k: HueKind) => (k === 'hue' ? 'hue' : 'perceptual-cylindrical');

export function mkRotateHue(kind: HueKind): MethodDef {
	return method(
		'rotateHue',
		[p('degrees')],
		'color',
		kind === 'hue' ? 'Rotate the HSL hue (naive)' : 'Rotate the hue perceptually (OKLCH)',
		(self, [d]) => rotated(self, num(d), kind),
		tag(kind)
	);
}
export function mkComplementary(kind: HueKind): MethodDef {
	return method(
		'complementary',
		[],
		'color',
		'The opposite hue (180°)',
		(self) => rotated(self, 180, kind),
		tag(kind)
	);
}
export function mkTriadic(kind: HueKind): MethodDef {
	return method(
		'triadic',
		[],
		'colors',
		'Three evenly spaced hues',
		(self) => [self, rotated(self, 120, kind), rotated(self, 240, kind)],
		tag(kind)
	);
}
export function mkAnalogous(kind: HueKind): MethodDef {
	return method(
		'analogous',
		[p('angle', 'number', { optional: true })],
		'colors',
		'Neighbouring hues either side',
		(self, [a]) => {
			const ang = a === undefined ? 30 : num(a);
			return [rotated(self, -ang, kind), self, rotated(self, ang, kind)];
		},
		tag(kind)
	);
}

/** Naive (RGB-cylindrical) harmony — "thinking in HSL". */
export const HUE_OPS: MethodDef[] = [
	mkRotateHue('hue'),
	mkComplementary('hue'),
	mkTriadic('hue'),
	mkAnalogous('hue')
];

/** Perceptual harmony (correct hues) — "thinking in OKLCH". */
export const PERCEPTUAL_CYL_OPS: MethodDef[] = [
	mkRotateHue('perceptual'),
	mkComplementary('perceptual'),
	mkTriadic('perceptual'),
	mkAnalogous('perceptual')
];

// --- RGB family: accessibility + CVD ---

const CVD_FILTERS: Record<string, (severity?: number) => (c: CuloriColor) => CuloriColor> = {
	protanopia: filterDeficiencyProt,
	protanomaly: filterDeficiencyProt,
	deuteranopia: filterDeficiencyDeuter,
	deuteranomaly: filterDeficiencyDeuter,
	tritanopia: filterDeficiencyTrit,
	tritanomaly: filterDeficiencyTrit
};

export const RGB_OPS: MethodDef[] = [
	method(
		'contrastWCAG',
		[p('other', 'color')],
		'number',
		'WCAG 2.1 contrast ratio (1–21)',
		(self, [o]) => wcagContrast(self.project('rgb'), color(o).project('rgb')),
		'rgb'
	),
	method(
		'meetsAA',
		[p('other', 'color'), p('large', 'number', { optional: true })],
		'boolean',
		'Passes WCAG AA (≥4.5, or ≥3 for large text)',
		(self, [o, large]) =>
			wcagContrast(self.project('rgb'), color(o).project('rgb')) >= (large ? 3 : 4.5),
		'rgb'
	),
	method(
		'meetsAAA',
		[p('other', 'color'), p('large', 'number', { optional: true })],
		'boolean',
		'Passes WCAG AAA (≥7, or ≥4.5 for large text)',
		(self, [o, large]) =>
			wcagContrast(self.project('rgb'), color(o).project('rgb')) >= (large ? 4.5 : 7),
		'rgb'
	),
	accessor(
		'luminance',
		'number',
		'Relative luminance (WCAG)',
		(self) => wcagLuminance(self.project('rgb')),
		'rgb'
	),
	method(
		'invert',
		[],
		'color',
		'Invert the RGB channels',
		(self) => {
			const c = self.project('rgb') as unknown as Record<string, number | undefined>;
			return ColorValue.from({
				mode: 'rgb',
				r: 1 - (c.r ?? 0),
				g: 1 - (c.g ?? 0),
				b: 1 - (c.b ?? 0)
			} as unknown as CuloriColor);
		},
		'rgb'
	),
	method(
		'grayscale',
		[],
		'color',
		'Luma-preserving desaturation',
		(self) => ColorValue.from(filterGrayscale()(self.project('rgb'))),
		'rgb'
	),
	method(
		'simulateCVD',
		[p('type', 'string'), p('severity', 'number', { optional: true })],
		'color',
		'Simulate color-vision deficiency (protan/deuter/tritan)',
		(self, [t, sev]) => {
			const key = str(t).toLowerCase();
			const f = CVD_FILTERS[key];
			if (!f) throw new Error(`Unknown CVD type: ${str(t)}`);
			return ColorValue.from(f(sev === undefined ? 1 : num(sev))(self.project('rgb')));
		},
		'rgb'
	)
];

// --- Lab family: the ΔE difference formulas ---

export const LAB_OPS: MethodDef[] = [
	method(
		'deltaE2000',
		[p('other', 'color')],
		'number',
		'CIEDE2000 color difference',
		(self, [o]) => differenceCiede2000()(self.project('lab'), color(o).project('lab')),
		'lab'
	),
	method(
		'deltaE76',
		[p('other', 'color')],
		'number',
		'CIE76 (Euclidean Lab) color difference',
		(self, [o]) => differenceCie76()(self.project('lab'), color(o).project('lab')),
		'lab'
	),
	method(
		'deltaE94',
		[p('other', 'color')],
		'number',
		'CIE94 color difference',
		(self, [o]) => differenceCie94()(self.project('lab'), color(o).project('lab')),
		'lab'
	),
	method(
		'deltaECMC',
		[p('other', 'color')],
		'number',
		'CMC l:c color difference',
		(self, [o]) => differenceCmc()(self.project('lab'), color(o).project('lab')),
		'lab'
	),
	method(
		'isPerceptiblyDifferent',
		[p('other', 'color'), p('threshold', 'number', { optional: true })],
		'boolean',
		'ΔE2000 above a just-noticeable-difference threshold',
		(self, [o, t]) =>
			differenceCiede2000()(self.project('lab'), color(o).project('lab')) >
			(t === undefined ? 2.3 : num(t)),
		'lab'
	)
];
