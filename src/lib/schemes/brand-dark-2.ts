import { OKLCH, type ColorGroup } from '$lib/oklch';

// ─── Helpers ───────────────────────────────────────────────
// Generate a scale of variants from a base color by crossing
// lightness steps with chroma modes. Reads top-to-bottom as:
// "for each step, for each chroma mode, produce a color."

type Step = { name: string; l: number };
type ChromaMode = { suffix: string; cSign: -1 | 0 | 1 };

function generateScale(
	base: OKLCH,
	prefix: string,
	steps: Step[],
	chromaModes: ChromaMode[],
	cPerL: number // chroma shift per unit of lightness shift
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

// ─── 1. Sources ────────────────────────────────────────────
// The single seed value. Everything else derives from this.

const background = new OKLCH('background', 0.255, 0.0233, 230.47, 'Source');

// ─── 2. Core colors ───────────────────────────────────────
// Each is defined by its relationship to existing colors.

const foreground = new OKLCH(
	'foreground',
	1 - background.l,                            // invert lightness
	background.c / 3,                             // reduce chroma
	((background.h + 180) % 360 + 360) % 360,    // opposite hue
	'1 - $bg.l, $bg.c / 3, $bg.h + 180'
);

const primary = new OKLCH(
	'primary',
	foreground.l,                                 // match foreground lightness
	background.c * 3,                             // triple background chroma
	((foreground.h + 360 / 5) % 360 + 360) % 360, // rotate hue by 72deg
	'$fg.l, $bg.c * 3, $fg.h + 72'
);

const secondary = primary.derive('secondary', {
	h: ((primary.h + 180) % 360 + 360) % 360,    // opposite of primary
}, '$primary.l, $primary.c, $primary.h + 180');

const accent = primary.derive('accent', {
	h: foreground.h,                              // foreground's hue
}, '$primary.l, $primary.c, $fg.h');

// ─── 3. Background scale ──────────────────────────────────
// 3 levels in each direction from the base, each rendered in
// 3 chroma modes: saturated (+c), flat (0), desaturated (-c).
//
// The chroma shift scales proportionally with the lightness
// shift: bigger step = bigger chroma adjustment.
//
//  Level     | Lightness | Chroma (sat)  | Chroma (desat)
//  ----------|-----------|---------------|---------------
//  lightest  | +0.110    | +0.010        | -0.010
//  lighter   | +0.073    | +0.007        | -0.007
//  light     | +0.037    | +0.003        | -0.003
//  (base)    |  0        |  0            |  0
//  dark      | -0.037    | +0.003        | -0.003
//  darker    | -0.073    | +0.007        | -0.007
//  darkest   | -0.110    | +0.010        | -0.010

const L_MAX = 0.11;
const C_PER_L = 0.01 / 0.11; // chroma shift per unit of lightness shift

const bgSteps: Step[] = [
	{ name: 'lightest', l:  L_MAX },
	{ name: 'lighter',  l:  L_MAX * 2/3 },
	{ name: 'light',    l:  L_MAX * 1/3 },
	{ name: 'dark',     l: -L_MAX * 1/3 },
	{ name: 'darker',   l: -L_MAX * 2/3 },
	{ name: 'darkest',  l: -L_MAX },
];

const chromaModes: ChromaMode[] = [
	{ suffix: 'sat',   cSign:  1 },  // more colorful
	{ suffix: 'flat',  cSign:  0 },  // neutral
	{ suffix: 'desat', cSign: -1 },  // less colorful
];

const bgVariants = generateScale(background, 'bg', bgSteps, chromaModes, C_PER_L);

// ─── 4. Semantic colors ───────────────────────────────────
// Same lightness/chroma as primary but at fixed hue angles
// associated with their meaning. Double chroma for vibrancy.

const semanticChroma = primary.c * 2;

const semantics = [
	{ name: 'success', hue: 140, label: 'green' },
	{ name: 'warning', hue: 70,  label: 'yellow-orange' },
	{ name: 'error',   hue: 30,  label: 'red' },
	{ name: 'info',    hue: 240, label: 'blue' },
].map(({ name, hue, label }) =>
	new OKLCH(name, primary.l, semanticChroma, hue,
		`$primary.l, $primary.c * 2, ${hue} (${label} hue)`)
);

// ─── 5. Harmony colors ───────────────────────────────────
// Geometric hue relationships from primary.

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
// Primary at every 45deg offset (skipping 0 and 180 which are
// primary and secondary).

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
