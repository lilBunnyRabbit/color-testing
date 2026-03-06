import { OKLCH, type ColorGroup } from '$lib/oklch';

// ─── Helpers ───────────────────────────────────────────────

type Step = { name: string; l: number };
type ChromaMode = { suffix: string; cSign: -1 | 0 | 1 };

function generateScale(
	base: OKLCH,
	prefix: string,
	steps: Step[],
	chromaModes: ChromaMode[],
	cPerL: number
): OKLCH[] {
	return steps.flatMap((step) =>
		chromaModes.map((mode) => {
			const cDelta = mode.cSign * Math.abs(step.l) * cPerL;
			return base.shift(`${prefix}-${step.name}-${mode.suffix}`, {
				l: step.l,
				c: cDelta,
			});
		})
	);
}

// ─── 1. Source ──────────────────────────────────────────────
// Warm cream base. High lightness, low chroma, yellow-ish hue.

const background = new OKLCH('background', 0.96, 0.018, 85, 'Source (warm cream)');

// ─── 2. Core colors ────────────────────────────────────────

// Dark muted blue-gray — cool contrast to the warm background.
const foreground = new OKLCH(
	'foreground',
	background.l / 2,                              // half the lightness → 0.48
	background.c,                                   // same low chroma
	((background.h + 155) % 360 + 360) % 360,      // rotate toward blue → 240
	'$bg.l / 2, $bg.c, $bg.h + 155'
);

// Warm peach — midpoint lightness, vivid, near the bg hue family.
const primary = new OKLCH(
	'primary',
	(background.l + foreground.l) / 2,              // midpoint → 0.72
	foreground.c * 5,                                // 5x for vibrancy → 0.09
	background.h - 25,                               // shift toward orange → 60
	'($bg.l + $fg.l) / 2, $fg.c * 5, $bg.h - 25'
);

const secondary = primary.derive('secondary', {
	h: ((primary.h + 180) % 360 + 360) % 360,      // complement → blue
}, '$primary.l, $primary.c, $primary.h + 180');

const accent = primary.derive('accent', {
	h: ((primary.h - 90) % 360 + 360) % 360,        // -90° from primary → rose (330)
}, '$primary.l, $primary.c, $primary.h - 90');

// ─── 3. Background scale ──────────────────────────────────
// Tighter range than dark theme — we're near the L=1.0 ceiling.
//
// For a warm light theme, darker surfaces gain warmth (more
// chroma) while lighter surfaces fade toward white (less chroma).
//
//  Level     | Lightness | Chroma (sat)  | Chroma (desat)
//  ----------|-----------|---------------|---------------
//  lightest  | +0.035    | +0.005        | -0.005
//  lighter   | +0.023    | +0.003        | -0.003
//  light     | +0.012    | +0.002        | -0.002
//  (base)    |  0        |  0            |  0
//  dark      | -0.012    | +0.002        | -0.002
//  darker    | -0.023    | +0.003        | -0.003
//  darkest   | -0.035    | +0.005        | -0.005

const L_MAX = 0.035;
const C_PER_L = 0.15; // chroma shift = 15% of lightness shift

const bgSteps: Step[] = [
	{ name: 'lightest', l:  L_MAX },
	{ name: 'lighter',  l:  L_MAX * 2/3 },
	{ name: 'light',    l:  L_MAX * 1/3 },
	{ name: 'dark',     l: -L_MAX * 1/3 },
	{ name: 'darker',   l: -L_MAX * 2/3 },
	{ name: 'darkest',  l: -L_MAX },
];

const chromaModes: ChromaMode[] = [
	{ suffix: 'sat',   cSign:  1 },
	{ suffix: 'flat',  cSign:  0 },
	{ suffix: 'desat', cSign: -1 },
];

const bgVariants = generateScale(background, 'bg', bgSteps, chromaModes, C_PER_L);

// ─── 4. Semantic colors ───────────────────────────────────
// Same lightness as primary, double chroma for vibrancy,
// fixed hues matching their meaning.

const semanticChroma = primary.c * 2;

const semantics = [
	{ name: 'success', hue: 145, label: 'green' },
	{ name: 'warning', hue: 75,  label: 'amber' },
	{ name: 'error',   hue: 25,  label: 'red' },
	{ name: 'info',    hue: 230, label: 'blue' },
].map(({ name, hue, label }) =>
	new OKLCH(name, primary.l, semanticChroma, hue,
		`$primary.l, $primary.c * 2, ${hue} (${label} hue)`)
);

// ─── 5. Harmony colors ───────────────────────────────────

const harmonies: { name: string; hueShift: number; desc: string }[] = [
	{ name: 'triad-a',  hueShift: -120, desc: 'triad' },
	{ name: 'triad-b',  hueShift:  120, desc: 'triad' },
	{ name: 'split-a',  hueShift:  150, desc: 'split compl.' },
	{ name: 'split-b',  hueShift:  210, desc: 'split compl.' },
];

const harmonyColors = harmonies.map(({ name, hueShift, desc }) =>
	primary.shift(name, { h: ((hueShift % 360) + 360) % 360 },
		`$primary.l, $primary.c, $primary.h ${hueShift > 0 ? '+' : '-'} ${Math.abs(hueShift)} (${desc})`)
);

// ─── 6. Hue rotation ring ─────────────────────────────────

const hueRotations = [45, 90, 135, 225, 270, 315].map((angle) =>
	new OKLCH(`hue-${angle}`, primary.l, primary.c,
		((primary.h + angle) % 360 + 360) % 360,
		`$primary.l, $primary.c, $primary.h + ${angle}`)
);

// ─── Export ────────────────────────────────────────────────

const groups: ColorGroup[] = [
	{
		label: 'Background (saturated | flat | desaturated per step)',
		colors: [...bgVariants.slice(0, 9), background, ...bgVariants.slice(9)],
	},
	{
		label: 'Core',
		colors: [foreground, primary, secondary, accent],
	},
	{
		label: 'Semantic',
		colors: semantics,
	},
	{
		label: 'Triad / Split complementary',
		colors: harmonyColors,
	},
	{
		label: 'Hue rotations',
		colors: hueRotations,
	},
];

export default groups;
