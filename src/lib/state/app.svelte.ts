/**
 * The single reactive store: source -> EvalResult -> Scheme, plus the analysis
 * view-state (CVD mode, fg opacity). Everything downstream is $derived; no panel
 * mutates the scheme.
 */
import { evaluate, type EvalResult } from '$lib/dsl/evaluator';
import { schemeFromEvalResult } from '$lib/scheme/adapter';
import type { Scheme } from '$lib/scheme/types';
import type { VisionSimulation } from '$lib/analysis/cvd';

export class AppStore {
	source = $state('');
	visionSim = $state<VisionSimulation>('none');
	fgOpacity = $state(100);

	result: EvalResult = $derived(evaluate(this.source));
	scheme: Scheme = $derived(schemeFromEvalResult(this.result, this.source));
	fgAlpha = $derived(this.fgOpacity / 100);
}

export const app = new AppStore();
