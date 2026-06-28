/**
 * The single reactive store: source -> EvalResult -> Scheme, plus the analysis
 * view-state (CVD mode, fg opacity) and the theme role mapping. Everything
 * downstream is $derived; no panel mutates the scheme.
 */
import { evaluate, type EvalResult } from '$lib/dsl/evaluator';
import { schemeFromEvalResult } from '$lib/scheme/adapter';
import type { Scheme } from '$lib/scheme/types';
import type { VisionSimulation } from '$lib/analysis/cvd';
import {
	emptyRoles,
	resolveRoles,
	cssVars as buildVars,
	auditPairs as buildAudit,
	DEFAULT_OPACITIES,
	type Roles,
	type Opacities,
	type AuditPair
} from '$lib/scheme/roles';

export class AppStore {
	source = $state('');
	visionSim = $state<VisionSimulation>('none');
	fgOpacity = $state(100);

	/** Sparse user overrides; `''` per role means "auto". */
	roles = $state<Roles>(emptyRoles());
	opacities = $state<Opacities>({ ...DEFAULT_OPACITIES });

	result: EvalResult = $derived(evaluate(this.source));
	scheme: Scheme = $derived(schemeFromEvalResult(this.result, this.source));
	fgAlpha = $derived(this.fgOpacity / 100);

	/** Overrides collapsed onto the auto heuristic — dangling names self-heal. */
	effectiveRoles: Roles = $derived(resolveRoles(this.scheme.entries, this.roles));

	themeVars: string = $derived(buildVars(this.scheme, this.effectiveRoles, this.opacities));
	audit: AuditPair[] = $derived(buildAudit(this.scheme, this.effectiveRoles, this.opacities));
}

export const app = new AppStore();
