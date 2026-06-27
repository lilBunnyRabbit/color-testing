import type { CuloriColor } from './registry';
import {
	toMode,
	getModel,
	CHANNELS,
	formatHex,
	isDisplayable,
	inGamut,
	clampChroma
} from './registry';
import { ModelView } from './view';

export type PlainObject = { [key: string]: DSLValue };
export type DSLValue =
	| number
	| string
	| boolean
	| ColorValue
	| ModelView
	| DSLValue[]
	| PlainObject
	| DSLFunction;
export type DSLFunction = (...args: DSLValue[]) => DSLValue;

export function isColorValue(v: unknown): v is ColorValue {
	return v instanceof ColorValue;
}

/**
 * The one canonical, immutable color. OKLCH is the storage space; every other
 * model is a lazily-cached culori projection. Behaviour does NOT live here — it
 * lives in the registry and is surfaced through views (c.hsl, c.lab, …) and the
 * root flat-shortcuts (c.lighten, c.rotate, …).
 */
export class ColorValue {
	private readonly _oklch: CuloriColor;
	private readonly _proj = new Map<string, CuloriColor>();
	private readonly _views = new Map<string, ModelView>();

	constructor(c: CuloriColor) {
		const ok = toMode('oklch')(c) as CuloriColor | undefined;
		if (!ok) throw new Error('Invalid color');
		this._oklch = ok;
		this._proj.set('oklch', ok);
	}

	static from(c: CuloriColor): ColorValue {
		return new ColorValue(c);
	}

	/** Memoized culori projection into any mode (the implicit-conversion core). */
	project(mode: string): CuloriColor {
		let p = this._proj.get(mode);
		if (!p) {
			const out = toMode(mode)(this._oklch) as CuloriColor | undefined;
			if (!out) throw new Error(`Cannot convert to ${mode}`);
			p = out;
			this._proj.set(mode, p);
		}
		return p;
	}

	/** Read a namespaced channel (ok_l, lab_a, hwb_w, h, r…) regardless of view. */
	channel(key: string): number {
		const ch = CHANNELS.get(key);
		if (!ch) throw new Error(`Unknown channel: ${key}`);
		const v = (this.project(ch.mode) as unknown as Record<string, number | undefined>)[ch.culoriField];
		return (v ?? 0) * (ch.scale ?? 1);
	}

	/** Memoized view object: c.oklch / c.hsl / c.lab. */
	view(modelId: string): ModelView {
		let v = this._views.get(modelId);
		if (!v) {
			const def = getModel(modelId);
			if (!def) throw new Error(`Unknown model: ${modelId}`);
			v = new ModelView(this, def);
			this._views.set(modelId, v);
		}
		return v;
	}

	/**
	 * Member dispatch for a bare value: channels → views → root flat-shortcuts.
	 * The DSL evaluator routes `color.<prop>` through here.
	 */
	member(prop: string): DSLValue | undefined {
		if (CHANNELS.has(prop)) return this.channel(prop);
		if (prop !== 'root' && getModel(prop)) return this.view(prop);
		const root = getModel('root');
		const m = root?.methods.get(prop);
		if (m) {
			if (m.kind === 'accessor') return m.impl(this, []);
			return (...args: DSLValue[]) => m.impl(this, args);
		}
		return undefined;
	}

	get hex(): string {
		return formatHex(this._oklch) ?? '#000000';
	}
	get inGamut(): boolean {
		return isDisplayable(this._oklch);
	}
	get inP3(): boolean {
		return inGamut('p3')(this._oklch);
	}
	/** Chroma-clamped into the sRGB gamut (display convenience). */
	get gamutMapped(): ColorValue {
		return ColorValue.from(clampChroma(this._oklch, 'oklch'));
	}
	toCSS(): string {
		const def = getModel('oklch');
		return def ? def.toCSS(this) : this.hex;
	}
	toString(): string {
		return this.hex;
	}
}
