/**
 * The DSL global environment: constructors + free functions + math, built on
 * the model engine. (P2 will generate the constructor/builtin set directly from
 * the manifest; for now it mirrors today's surface on top of ColorValue.)
 */
import { OKLCH, HSL, RGB, hex, type DSLValue } from '../models/index.js';
import { num, color, oklchMix } from '../models/util.js';
import { wcagContrast, differenceCiede2000 } from '../models/registry.js';

export function createEnvironment(): Map<string, DSLValue> {
	const env = new Map<string, DSLValue>();

	// Color constructors (each yields the same canonical ColorValue)
	env.set('OKLCH', OKLCH);
	env.set('HSL', HSL);
	env.set('RGB', RGB);
	env.set('hex', hex);

	// Free functions
	env.set('mix', (a: DSLValue, b: DSLValue, r?: DSLValue) =>
		oklchMix(color(a), color(b), r === undefined ? 0.5 : num(r))
	);
	env.set('contrast', (a: DSLValue, b: DSLValue) =>
		wcagContrast(color(a).project('oklch'), color(b).project('oklch'))
	);
	env.set('deltaE', (a: DSLValue, b: DSLValue) =>
		differenceCiede2000()(color(a).project('lab'), color(b).project('lab'))
	);

	// Math
	env.set('abs', (n: DSLValue) => Math.abs(num(n)));
	env.set('min', (...args: DSLValue[]) => Math.min(...args.map(num)));
	env.set('max', (...args: DSLValue[]) => Math.max(...args.map(num)));
	env.set('round', (n: DSLValue) => Math.round(num(n)));
	env.set('floor', (n: DSLValue) => Math.floor(num(n)));
	env.set('ceil', (n: DSLValue) => Math.ceil(num(n)));
	env.set('clamp', (v: DSLValue, lo: DSLValue, hi: DSLValue) =>
		Math.max(num(lo), Math.min(num(hi), num(v)))
	);

	return env;
}
