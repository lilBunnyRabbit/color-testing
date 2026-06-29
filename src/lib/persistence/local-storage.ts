/** Named schemes + autosave in localStorage (client-only; all calls guarded). */
const LAST = 'chromatics:last';
const PREFIX = 'chromatics:scheme:';
const WELCOMED = 'chromatics:welcomed';

function safe<T>(fn: () => T, fallback: T): T {
	try {
		if (typeof localStorage === 'undefined') return fallback;
		return fn();
	} catch {
		return fallback;
	}
}

export function saveLast(source: string): void {
	safe(() => localStorage.setItem(LAST, source), undefined);
}
export function loadLast(): string | null {
	return safe(() => localStorage.getItem(LAST), null);
}

export function saveScheme(name: string, source: string): void {
	safe(() => localStorage.setItem(PREFIX + name, source), undefined);
}
export function loadScheme(name: string): string | null {
	return safe(() => localStorage.getItem(PREFIX + name), null);
}
export function deleteScheme(name: string): void {
	safe(() => localStorage.removeItem(PREFIX + name), undefined);
}
export function listSchemes(): string[] {
	return safe(() => {
		const out: string[] = [];
		for (let i = 0; i < localStorage.length; i++) {
			const k = localStorage.key(i);
			if (k?.startsWith(PREFIX)) out.push(k.slice(PREFIX.length));
		}
		return out.sort();
	}, []);
}

/**
 * First-run flag for the welcome showcase. Defaults to "already welcomed" when
 * storage is unavailable (SSR / privacy mode) so the modal never auto-pops in a
 * context where we can't persist the dismissal.
 */
export function hasWelcomed(): boolean {
	return safe(() => localStorage.getItem(WELCOMED) === '1', true);
}
export function markWelcomed(): void {
	safe(() => localStorage.setItem(WELCOMED, '1'), undefined);
}
