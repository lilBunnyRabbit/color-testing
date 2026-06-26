/**
 * Semantic role mapping (ported from master:demo). Maps scheme entries onto the
 * 12 theme roles, then derives the CSS custom properties the previews consume
 * and the accessibility audit pairs. Roles are indices into `scheme.entries`.
 */
import type { Scheme, SchemeEntry } from './types.js';
import { contrastRatio, contrastRatioAlpha } from '../analysis/contrast.js';

export interface Roles {
	bg: number;
	fg: number;
	primary: number;
	secondary: number;
	tertiary: number;
	accent: number;
	surface: number;
	border: number;
	primaryFg: number;
	secondaryFg: number;
	tertiaryFg: number;
	accentFg: number;
}

export interface Opacities {
	muted: number;
	disabled: number;
	hover: number;
	active: number;
}

export const DEFAULT_OPACITIES: Opacities = { muted: 0.65, disabled: 0.38, hover: 0.85, active: 0.7 };

export function emptyRoles(): Roles {
	return {
		bg: 0,
		fg: 1,
		primary: 2,
		secondary: -1,
		tertiary: -1,
		accent: -1,
		surface: -1,
		border: -1,
		primaryFg: -1,
		secondaryFg: -1,
		tertiaryFg: -1,
		accentFg: -1
	};
}

/** Heuristic auto-assignment from entry names. */
export function autoAssign(entries: SchemeEntry[]): Roles {
	const find = (...names: string[]) =>
		entries.findIndex((e) => names.some((n) => e.name.toLowerCase().includes(n)));
	return {
		bg: Math.max(0, find('background', 'bg')),
		fg: Math.max(0, find('foreground', 'fg', 'text')),
		primary: Math.max(0, find('primary')),
		secondary: find('secondary'),
		tertiary: find('tertiary'),
		accent: find('accent'),
		surface: find('surface', 'bg_dark', 'bg_light', 'bg_lighter', 'bg_darker'),
		border: -1,
		primaryFg: -1,
		secondaryFg: -1,
		tertiaryFg: -1,
		accentFg: -1
	};
}

/** The CSS custom-property string applied to a preview container. */
export function cssVars(scheme: Scheme, roles: Roles, op: Opacities): string {
	const cs = scheme.entries;
	const bg = cs[roles.bg];
	const fg = cs[roles.fg];
	const primary = cs[roles.primary];
	if (!bg || !fg || !primary) return '';

	const get = (idx: number, fb: SchemeEntry) => (idx >= 0 ? (cs[idx] ?? fb) : fb);
	const secondary = get(roles.secondary, primary);
	const tertiary = get(roles.tertiary, secondary);
	const accent = get(roles.accent, primary);
	const surface = get(roles.surface, bg);
	const border = get(roles.border, fg);
	const primaryFg = get(roles.primaryFg, fg);
	const secondaryFg = get(roles.secondaryFg, fg);
	const tertiaryFg = get(roles.tertiaryFg, fg);
	const accentFg = get(roles.accentFg, fg);
	const css = (e: SchemeEntry) => e.color.toCSS();

	return [
		`--bg:${css(bg)}`,
		`--fg:${css(fg)}`,
		`--primary:${css(primary)}`,
		`--primary-fg:${css(primaryFg)}`,
		`--secondary:${css(secondary)}`,
		`--secondary-fg:${css(secondaryFg)}`,
		`--tertiary:${css(tertiary)}`,
		`--tertiary-fg:${css(tertiaryFg)}`,
		`--accent:${css(accent)}`,
		`--accent-fg:${css(accentFg)}`,
		`--surface:${css(surface)}`,
		`--surface-fg:${css(fg)}`,
		`--border:${css(border)}`,
		`--op-muted:${op.muted}`,
		`--op-disabled:${op.disabled}`,
		`--op-hover:${op.hover}`,
		`--op-active:${op.active}`
	].join(';');
}

export interface AuditPair {
	label: string;
	fg: string;
	bg: string;
	ratio: number;
	large?: boolean;
}

/** The ~21 real-world fg/bg pairs the audit panel checks. */
export function auditPairs(scheme: Scheme, roles: Roles, op: Opacities): AuditPair[] {
	const cs = scheme.entries;
	const bgC = cs[roles.bg];
	const fgC = cs[roles.fg];
	const priC = cs[roles.primary];
	if (!bgC || !fgC || !priC) return [];

	const get = (idx: number, fb: SchemeEntry) => (idx >= 0 ? (cs[idx] ?? fb) : fb);
	const secC = get(roles.secondary, priC);
	const terC = get(roles.tertiary, secC);
	const accC = get(roles.accent, priC);
	const surC = get(roles.surface, bgC);
	const borC = get(roles.border, fgC);
	const priFgC = get(roles.primaryFg, fgC);
	const secFgC = get(roles.secondaryFg, fgC);
	const terFgC = get(roles.tertiaryFg, fgC);
	const accFgC = get(roles.accentFg, fgC);

	const pair = (
		label: string,
		fg: SchemeEntry,
		bg: SchemeEntry,
		alpha?: number,
		large?: boolean
	): AuditPair => ({
		label,
		fg: fg.name + (alpha != null ? ` @${alpha}` : ''),
		bg: bg.name,
		ratio: alpha != null ? contrastRatioAlpha(fg.color, bg.color, alpha) : contrastRatio(fg.color, bg.color),
		large
	});

	return [
		pair('Body text', fgC, bgC),
		pair('Muted text', fgC, bgC, op.muted),
		pair('Disabled text', fgC, bgC, op.disabled),
		pair('Body on surface', fgC, surC),
		pair('Muted on surface', fgC, surC, op.muted),
		pair('Primary btn', priFgC, priC),
		pair('Secondary btn', secFgC, secC),
		pair('Tertiary btn', terFgC, terC),
		pair('Accent btn', accFgC, accC),
		pair('Primary on bg', priC, bgC),
		pair('Primary on surface', priC, surC),
		pair('Secondary on bg', secC, bgC),
		pair('Secondary on surface', secC, surC),
		pair('Tertiary on bg', terC, bgC),
		pair('Accent on bg', accC, bgC),
		pair('Badge muted', fgC, borC, op.muted),
		pair('Stats banner label', priFgC, priC, 0.8),
		pair('CTA sub', secFgC, secC, 0.85),
		pair('Nav link (muted)', fgC, bgC, op.muted),
		pair('Dash nav active', priFgC, priC),
		pair('Dash nav item', fgC, surC, op.muted)
	];
}
