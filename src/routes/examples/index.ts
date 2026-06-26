import { name as simpleName, source as simpleSource } from './simple';
import { name as brandDarkName, source as brandDarkSource } from './brand-dark';

export interface Example {
	name: string;
	source: string;
}

/** Ordered list of editor examples. First entry is the default on load. */
export const examples: Example[] = [
	{ name: simpleName, source: simpleSource },
	{ name: brandDarkName, source: brandDarkSource }
];
