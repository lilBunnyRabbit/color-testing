import { test, expect, describe } from 'bun:test';
import { buildManifest } from '../src/lib/dsl/manifest';
import { register, defineModel, allModels, CHANNELS } from '../src/lib/models/registry';
import { method, p } from '../src/lib/models/util';
import { evaluate } from '../src/lib/dsl/evaluator';
import type { CuloriColor } from '../src/lib/models/registry';

describe('zero-edit extensibility (P6 guarantee)', () => {
	test('registering a model surfaces it everywhere via the manifest', () => {
		register(
			defineModel({
				id: '__demo__',
				label: 'Demo',
				family: 'hue',
				ctor: {
					name: 'DEMO',
					params: [p('a')],
					build: ([a]) => ({ mode: 'oklch', l: a, c: 0, h: 0 }) as unknown as CuloriColor
				},
				channels: [{ key: 'demo_a', localKey: 'a', label: 'A', culoriField: 'l', range: [0, 1] }],
				ownMethods: [method('demoOp', [], 'color', 'demo op', (self) => self)]
			})
		);
		const m = buildManifest(allModels(), CHANNELS);
		expect(m.viewMembers.has('__demo__')).toBe(true);
		expect(m.methodNames.has('demoOp')).toBe(true);
		expect(m.propertyNames.has('demo_a')).toBe(true);
		expect(m.constructors.some((c) => c.name === 'DEMO')).toBe(true);
	});
});

describe('long-tail models', () => {
	test('xyz (backed) — cross-model accessor + constructor work', () => {
		const r = evaluate('c = OKLCH(0.6, 0.12, 250)\ny = c.xyz_y\nx = XYZ(0.2, 0.21, 0.55)');
		expect(r.errors).toEqual([]);
		expect(typeof r.variables.get('y')!.value).toBe('number');
		expect(r.variables.get('x')).toBeDefined();
	});

	test('backed:false constructor throws an actionable error, caught per-statement', () => {
		const r = evaluate('a = OKLCH(0.6,0.1,200)\nbad = CMYK(0,0,0,1)\ngood = a.lighten(0.1)');
		expect(r.errors.length).toBe(1);
		expect(r.errors[0].message).toContain('@lilbunnyrabbit/chromatics');
		expect(r.errors[0].line).toBe(2);
		expect(r.variables.get('good')).toBeDefined();
	});

	test('backed:false view method also throws actionably', () => {
		const r = evaluate('a = OKLCH(0.6,0.1,200)\np = a.hct.tonalPalette()');
		expect(r.errors.length).toBe(1);
		expect(r.errors[0].message).toContain('@lilbunnyrabbit/chromatics');
	});
});
