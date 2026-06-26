import { test, expect, describe } from 'bun:test';
import { evaluate } from '../src/lib/dsl/evaluator';
import { schemeFromEvalResult } from '../src/lib/scheme/adapter';
import { autoAssign, cssVars, auditPairs, DEFAULT_OPACITIES } from '../src/lib/scheme/roles';
import { source as brandDark } from '../src/routes/examples/brand-dark';
import { wcagLevels } from '../src/lib/analysis/wcag';

function scheme(src: string) {
	return schemeFromEvalResult(evaluate(src), src);
}

describe('role mapping on brand-dark', () => {
	const s = scheme(brandDark);
	const roles = autoAssign(s.entries);

	test('auto-assigns bg/fg/primary by name', () => {
		expect(s.entries[roles.bg].name).toBe('bg');
		expect(s.entries[roles.fg].name).toBe('fg');
		expect(s.entries[roles.primary].name).toBe('primary');
		expect(s.entries[roles.secondary].name).toBe('secondary');
		expect(s.entries[roles.accent].name).toBe('accent');
	});

	test('cssVars emits every theme variable', () => {
		const vars = cssVars(s, roles, DEFAULT_OPACITIES);
		for (const v of ['--bg', '--fg', '--primary', '--primary-fg', '--surface', '--border', '--op-muted']) {
			expect(vars).toContain(v);
		}
	});

	test('audit produces the 21 pairs with finite ratios', () => {
		const audit = auditPairs(s, roles, DEFAULT_OPACITIES);
		expect(audit.length).toBe(21);
		for (const a of audit) {
			expect(Number.isFinite(a.ratio)).toBe(true);
			expect(a.ratio).toBeGreaterThanOrEqual(1);
		}
	});

	test('body text passes AA on brand-dark (fg on bg)', () => {
		const audit = auditPairs(s, roles, DEFAULT_OPACITIES);
		const body = audit.find((a) => a.label === 'Body text')!;
		expect(wcagLevels(body.ratio).normal).not.toBe('Fail');
	});
});

describe('cssVars guards', () => {
	test('returns empty string when bg/fg/primary are missing', () => {
		const s = scheme('x = 5');
		expect(cssVars(s, autoAssign(s.entries), DEFAULT_OPACITIES)).toBe('');
	});
});
