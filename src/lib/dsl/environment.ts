/**
 * The DSL global environment: constructors (generated from the registry) +
 * free functions + math. Because constructors come from the manifest, adding a
 * model is a pure data change — no edit here.
 */
import { manifest } from './manifest.js';
import { getModel, hex, ColorValue, type DSLValue } from '../models/index.js';
import { num, color, oklchMix } from '../models/util.js';
import { wcagContrast, differenceCiede2000 } from '../models/registry.js';

export function createEnvironment(): Map<string, DSLValue> {
	const env = new Map<string, DSLValue>();

	// Color constructors — derived from each model's registered ctor.
	for (const c of manifest.constructors) {
		if (c.name === 'hex') {
			env.set('hex', hex);
			continue;
		}
		const def = getModel(c.model);
		if (!def?.ctor) continue;
		const build = def.ctor.build;
		env.set(c.name, (...args: DSLValue[]) => ColorValue.from(build(args.map(num))));
	}

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
