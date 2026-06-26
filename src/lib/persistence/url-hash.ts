/** Share-link round-trip: the source text encoded into location.hash. */
export interface ShareState {
	source: string;
}

function utf8ToB64(s: string): string {
	return btoa(unescape(encodeURIComponent(s)));
}
function b64ToUtf8(s: string): string {
	return decodeURIComponent(escape(atob(s)));
}

export function encodeHash(state: ShareState): string {
	return encodeURIComponent(utf8ToB64(JSON.stringify({ s: state.source })));
}

export function decodeHash(hash: string): ShareState | null {
	try {
		const raw = hash.replace(/^#/, '');
		if (!raw) return null;
		const obj = JSON.parse(b64ToUtf8(decodeURIComponent(raw)));
		return typeof obj.s === 'string' ? { source: obj.s } : null;
	} catch {
		return null;
	}
}
