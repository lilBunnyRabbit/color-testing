import { OKLCH, type ColorGroup } from '$lib/oklch';

const background = new OKLCH('background', 0.255, 0.0233, 230.47, 'Source');

const foreground = new OKLCH(
	'foreground',
	1 - background.l,
	background.c / 3,
	((background.h + 180) % 360 + 360) % 360,
	'1 - $background.l, $background.c / 3, $background.h + 180'
);

const primary = new OKLCH(
	'primary',
	foreground.l,
	background.c * 3,
	((foreground.h + 360 / 5) % 360 + 360) % 360,
	'$foreground.l, $background.c * 3, $foreground.h + (360 / 5)'
);

// Background variant steps — tweak these to adjust all variants at once
// const lMax = 0.1;    // max lightness shift (lightest/darkest)
// const cMax = 0.01;   // max chroma shift (lightest/darkest)
const lMax = 0.11;
const cMax = 0.01;
const lMid = lMax * 2 / 3;
const lMin = lMax * 1 / 3;
const cMid = cMax * 2 / 3;
const cMin = cMax * 1 / 3;

const groups: ColorGroup[] = [
	{
		label: 'Background (chroma shift, no chroma shift, negative chroma shift)',
		colors: [
			background.shift('bg-lightest-sat', { l: lMax, c: cMax },
				`$background.l + ${lMax}, $background.c + ${cMax}, $background.h`),
			background.shift('bg-lightest-flat', { l: lMax },
				`$background.l + ${lMax}, $background.c, $background.h`),
			background.shift('bg-lightest-desat', { l: lMax, c: -cMax },
				`$background.l + ${lMax}, $background.c - ${cMax}, $background.h`),
			background.shift('bg-lighter-sat', { l: lMid, c: cMid },
				`$background.l + ${lMid}, $background.c + ${cMid}, $background.h`),
			background.shift('bg-lighter-flat', { l: lMid },
				`$background.l + ${lMid}, $background.c, $background.h`),
			background.shift('bg-lighter-desat', { l: lMid, c: -cMid },
				`$background.l + ${lMid}, $background.c - ${cMid}, $background.h`),
			background.shift('bg-light-sat', { l: lMin, c: cMin },
				`$background.l + ${lMin}, $background.c + ${cMin}, $background.h`),
			background.shift('bg-light-flat', { l: lMin },
				`$background.l + ${lMin}, $background.c, $background.h`),
			background.shift('bg-light-desat', { l: lMin, c: -cMin },
				`$background.l + ${lMin}, $background.c - ${cMin}, $background.h`),
			background,
			background.shift('bg-dark-sat', { l: -lMin, c: cMin },
				`$background.l - ${lMin}, $background.c + ${cMin}, $background.h`),
			background.shift('bg-dark-flat', { l: -lMin },
				`$background.l - ${lMin}, $background.c, $background.h`),
			background.shift('bg-dark-desat', { l: -lMin, c: -cMin },
				`$background.l - ${lMin}, $background.c - ${cMin}, $background.h`),
			background.shift('bg-darker-sat', { l: -lMid, c: cMid },
				`$background.l - ${lMid}, $background.c + ${cMid}, $background.h`),
			background.shift('bg-darker-flat', { l: -lMid },
				`$background.l - ${lMid}, $background.c, $background.h`),
			background.shift('bg-darker-desat', { l: -lMid, c: -cMid },
				`$background.l - ${lMid}, $background.c - ${cMid}, $background.h`),
			background.shift('bg-darkest-sat', { l: -lMax, c: cMax },
				`$background.l - ${lMax}, $background.c + ${cMax}, $background.h`),
			background.shift('bg-darkest-flat', { l: -lMax },
				`$background.l - ${lMax}, $background.c, $background.h`),
			background.shift('bg-darkest-desat', { l: -lMax, c: -cMax },
				`$background.l - ${lMax}, $background.c - ${cMax}, $background.h`),
		]
	},
	{
		label: 'Core',
		colors: [
			foreground,
			primary,
			primary.derive('secondary', { h: ((primary.h + 180) % 360 + 360) % 360 },
				'$primary.l, $primary.c, $primary.h + 180'),
			primary.derive('accent', { h: foreground.h },
				'$primary.l, $primary.c, $foreground.h'),
		]
	},
	{
		label: 'Semantic',
		colors: [
			new OKLCH('success', primary.l, primary.c * 2, 140,
				'$primary.l, $primary.c * 2, 140 (green hue)'),
			new OKLCH('warning', primary.l, primary.c * 2, 70,
				'$primary.l, $primary.c * 2, 70 (yellow-orange hue)'),
			new OKLCH('error', primary.l, primary.c * 2, 30,
				'$primary.l, $primary.c * 2, 30 (red hue)'),
			new OKLCH('info', primary.l, primary.c * 2, 240,
				'$primary.l, $primary.c * 2, 240 (blue hue)'),
		]
	},
	{
		label: 'Triad / Split complementary',
		colors: [
			primary.shift('triad-a', { h: -120 + 360 },
				'$primary.l, $primary.c, $primary.h - 120 (triad)'),
			primary.shift('triad-b', { h: 120 },
				'$primary.l, $primary.c, $primary.h + 120 (triad)'),
			primary.shift('split-a', { h: 150 },
				'$primary.l, $primary.c, $primary.h + 150 (split compl.)'),
			primary.shift('split-b', { h: 210 },
				'$primary.l, $primary.c, $primary.h + 210 (split compl.)'),
		]
	},
	{
		label: 'Hue rotations',
		colors: [
			new OKLCH('hue-45', primary.l, primary.c, ((primary.h + 45) % 360 + 360) % 360,
				'$primary.l, $primary.c, $primary.h + 45'),
			new OKLCH('hue-90', primary.l, primary.c, ((primary.h + 90) % 360 + 360) % 360,
				'$primary.l, $primary.c, $primary.h + 90'),
			new OKLCH('hue-135', primary.l, primary.c, ((primary.h + 135) % 360 + 360) % 360,
				'$primary.l, $primary.c, $primary.h + 135'),
			new OKLCH('hue-225', primary.l, primary.c, ((primary.h + 225) % 360 + 360) % 360,
				'$primary.l, $primary.c, $primary.h + 225'),
			new OKLCH('hue-270', primary.l, primary.c, ((primary.h + 270) % 360 + 360) % 360,
				'$primary.l, $primary.c, $primary.h + 270'),
			new OKLCH('hue-315', primary.l, primary.c, ((primary.h + 315) % 360 + 360) % 360,
				'$primary.l, $primary.c, $primary.h + 315'),
		]
	},
];

export default groups;

/*
| name                | hex     | oklch                      | comment                                                     |
| ------------------- | ------- | -------------------------- | ----------------------------------------------------------- |
| background-lightest | #293f4a | oklch(0.355 0.0333 230.47) | $background.l + 0.1, $background.c + 0.01, $background.h    |
| background-lighter  | #20323b | oklch(0.305 0.0283 230.47) | $background.l + 0.05, $background.c + 0.005, $background.h  |
| background          | #17252c | oklch(0.255 0.0233 230.47) | Source                                                      |
| background-darker   | #081a22 | oklch(0.205 0.0283 230.47) | $background.l - 0.05, $background.c + 0.005, $background.h  |
| background-darkest  | #000e18 | oklch(0.155 0.0333 230.47) | $background.l - 0.1, $background.c + 0.01, $background.h    |
| foreground          | #b1aba8 | oklch(0.745 0.00777 50.47) | 1 - $background.l, $background.c / 3, $background.h + 180   |
| primary             | #a4b483 | oklch(0.745 0.0699 122.47) | $foreground.l, $background.c * 3, $foreground.h + (360 / 5) |
| secondary           | #b5a2d2 | oklch(0.745 0.0699 302.47) | $primary.l, $primary.c, $primary.h + 180                    |
| accent              | #d1a085 | oklch(0.745 0.0699 50.47)  | $primary.l, $primary.c, $foreground.h                       |
| success             | #7ac26a | oklch(0.745 0.1398 140)    | $primary.l, $primary.c * 2, 'green' hue                     |
| warning             | #e49b39 | oklch(0.745 0.1398 70)     | $primary.l, $primary.c * 2, 'yellow-orange' hue             |
| error               | #f88876 | oklch(0.745 0.1398 30)     | $primary.l, $primary.c * 2, 'red' hue                       |
| info                | #49b7fb | oklch(0.745 0.1398 240)    | $primary.l, $primary.c * 2, 'blue' hue                      |

No chroma shift

| name                | hex     | oklch                      |
| ------------------- | ------- | -------------------------- |
| background-lightest | #2f3e46 | oklch(0.355 0.0233 230.47) |
| background-lighter  | #233139 | oklch(0.305 0.0233 230.47) |

Minus chroma shift

| name                | hex     | oklch                      |
| ------------------- | ------- | -------------------------- |
| background-lightest | #353d42 | oklch(0.355 0.0133 230.47) |
| background-lighter  | #263137 | oklch(0.305 0.0183 230.47) |

MORE, triad, split compl

| name | hex     | oklch                      |
| ---- | ------- | -------------------------- |
| A    | #80bba3 | oklch(0.745 0.0699 167.47) |
| A    | #77b9c6 | oklch(0.745 0.0699 212.47) |
| A    | #91aed9 | oklch(0.745 0.0699 257.47) |
| A    | #ce9bb5 | oklch(0.745 0.0699 347.47) |
| A    | #d59d91 | oklch(0.745 0.0699 32.47)  |
| A    | #c5a77a | oklch(0.745 0.0699 77.47)  |

100 = FF
 90 = E6
 80 = CC
 70 = B3
 60 = 99
 50 = 80
 40 = 66
 30 = 4D
 20 = 33
 10 = 1A
  5 = 0D



foreground-muted = foreground @ opacity 0.65
foreground-disabled = foreground @ opacity 0.38
hover opacity: 0.85
active opacity: 0.70
opacity-hover = 0.85
opacity-active = 0.70
opacity-muted = 0.65
opacity-disabled = 0.38
*/

/*
oking at your scheme, the background starts at oklch(0.255, 0.0233, 230.47) — a dark teal.  
  Here's my take:                                           
                                                                                                
  For lighter variants (light → lightest): positive chroma shift                                
  As surfaces get lighter in a dark theme, bumping chroma slightly keeps the tinted/branded feel
   alive. Without it, lighter surfaces tend to look washed-out and gray — you lose the identity 
  of the theme. In your screenshots, the leftmost columns (chroma shift) in the first image have
   a richer, more intentional look compared to the flat/desat versions.

  For darker variants (dark → darkest): negative chroma shift (desat)
  As you approach black, chroma becomes barely perceptible anyway. Desaturating lets dark
  variants fade naturally toward near-black. This also gives you slightly better contrast ratios
   (visible in your second screenshot — desat columns hit 9.0 AAA consistently). Adding chroma
  to already-dark surfaces can look artificially saturated for no visual payoff.

  This combination creates a natural depth gradient:
  - Darker = less color (receding, shadows lose saturation)
  - Lighter = more color (elevated, catching light)

  This mirrors real-world light behavior and is the approach most polished dark themes use (VS
  Code Dark+, GitHub Dark, etc.).

  So concretely: keep the bg-light* with +c and bg-dark* with -c, and drop the flat/opposite
  variants once you've committed. That said — this is subjective. If you want a more
  neutral/utilitarian feel, flat everywhere is also a solid choice.
*/