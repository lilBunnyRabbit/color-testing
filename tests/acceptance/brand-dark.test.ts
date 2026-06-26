import { test, expect } from 'bun:test';
import { evaluate } from '../../src/lib/dsl/evaluator';
import { source } from '../../src/routes/examples/brand-dark';
import { isColorValue } from '../../src/lib/models';

/**
 * Golden snapshot captured from the legacy `Color` evaluator before the swap
 * to the multi-model engine. The new engine must reproduce these byte-for-byte.
 */
const GOLDEN: Record<string, string> = {
	bg: '#17252c',
	fg: '#b1aba8',
	primary: '#a4b483',
	secondary: '#b5a2d2',
	accent: '#d1a085',
	bg_lightest: '#324149',
	bg_lighter: '#29373f',
	bg_light: '#202e35',
	bg_dark: '#0e1c23',
	bg_darker: '#07141a',
	bg_darkest: '#020c12',
	success: '#7ac26a',
	warning: '#e49b39',
	error: '#f88876',
	info: '#49b7fb',
	triad_a: '#d39aa8',
	triad_b: '#86b2d5',
	split_a: '#9daad9',
	split_b: '#c89cc0'
};

test('brand-dark evaluates with zero errors', () => {
	const r = evaluate(source);
	expect(r.errors).toEqual([]);
});

test('every named color matches the golden hex snapshot', () => {
	const r = evaluate(source);
	const got: Record<string, string> = {};
	for (const name of r.order) {
		const v = r.variables.get(name)!;
		if (isColorValue(v.value)) got[name] = v.value.hex;
	}
	expect(got).toEqual(GOLDEN);
});
