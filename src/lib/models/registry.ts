/**
 * The model registry — the ONLY module that imports culori.
 *
 * Everything else in the engine reaches conversion/measurement primitives
 * through the re-exports here, so culori stays swappable behind one seam
 * (the future `@lilbunnyrabbit/chromatics` package boundary).
 */
import {
	converter,
	parse,
	formatHex,
	formatCss,
	clampChroma,
	toGamut,
	wcagContrast,
	wcagLuminance,
	displayable,
	inGamut,
	differenceCie76,
	differenceCie94,
	differenceCiede2000,
	differenceCmc,
	differenceEuclidean,
	filterDeficiencyProt,
	filterDeficiencyDeuter,
	filterDeficiencyTrit,
	filterGrayscale,
	type Color as CuloriColor
} from 'culori';
import type { ModelDef, ModelSpec, ChannelDef, MethodDef } from './types';

// --- culori primitives, re-exported (single import site) ---
export {
	parse,
	formatHex,
	formatCss,
	clampChroma,
	toGamut,
	wcagContrast,
	wcagLuminance,
	displayable,
	inGamut,
	differenceCie76,
	differenceCie94,
	differenceCiede2000,
	differenceCmc,
	differenceEuclidean,
	filterDeficiencyProt,
	filterDeficiencyDeuter,
	filterDeficiencyTrit,
	filterGrayscale
};
export type { CuloriColor };

// --- mode converters (memoized) ---
const _conv = new Map<string, ReturnType<typeof converter>>();
export function toMode(mode: string) {
	let c = _conv.get(mode);
	if (!c) {
		c = converter(mode as Parameters<typeof converter>[0]);
		_conv.set(mode, c);
	}
	return c;
}

/**
 * Epsilon-tolerant sRGB gamut test. culori's strict `displayable` rejects
 * colors that sit a sub-epsilon outside [0,1] purely from float round-trips
 * (e.g. a gamut-mapped value whose green channel is -4e-16). For a "is this
 * color showable / did gamutMap succeed" predicate we absorb that noise.
 */
export function isDisplayable(c: CuloriColor, eps = 1e-5): boolean {
	const rgb = toMode('rgb')(c) as unknown as Record<string, number | undefined> | undefined;
	if (!rgb) return false;
	for (const k of ['r', 'g', 'b'] as const) {
		const v = rgb[k] ?? 0;
		if (v < -eps || v > 1 + eps) return false;
	}
	return true;
}

// --- the registry + global channel index ---
const _registry = new Map<string, ModelDef>();
export const CHANNELS = new Map<string, ChannelDef & { modelId: string; mode: string }>();

export function getModel(id: string): ModelDef | undefined {
	return _registry.get(id);
}
export function allModels(): ModelDef[] {
	return [..._registry.values()];
}

/** Compose a ModelSpec into a ModelDef: merge inherited ⊕ own methods. */
export function defineModel(spec: ModelSpec): ModelDef {
	const methods = new Map<string, MethodDef>();
	for (const m of spec.inherit ?? []) methods.set(m.name, m);
	for (const m of spec.ownMethods ?? []) methods.set(m.name, m); // own overrides inherited
	return {
		id: spec.id,
		mode: spec.mode ?? spec.id,
		label: spec.label,
		family: spec.family,
		ctor: spec.ctor,
		channels: spec.channels ?? [],
		methods,
		backed: spec.backed ?? true,
		priority: spec.priority,
		toCSS: spec.toCSS ?? ((self) => self.hex)
	};
}

/** Register a model and contribute its channels to the global CHANNELS index. */
export function register(def: ModelDef): ModelDef {
	_registry.set(def.id, def);
	for (const ch of def.channels) {
		// First registration wins, so a model never clobbers a sibling's flat key.
		if (!CHANNELS.has(ch.key)) {
			CHANNELS.set(ch.key, { ...ch, modelId: def.id, mode: def.mode });
		}
	}
	return def;
}
