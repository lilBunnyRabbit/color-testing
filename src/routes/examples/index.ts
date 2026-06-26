import { name as showcaseName, source as showcaseSource } from './showcase';
import { name as previewsName, source as previewsSource } from './previews';
import { name as simpleName, source as simpleSource } from './simple';
import { name as brandDarkName, source as brandDarkSource } from './brand-dark';
import { name as brandLightName, source as brandLightSource } from './brand-light';
import { name as dynamicName, source as dynamicSource } from './dynamic-theme';

export interface Example {
	name: string;
	source: string;
}

/** Ordered list of editor examples. First entry is the default on load. */
export const examples: Example[] = [
	{ name: showcaseName, source: showcaseSource },
	{ name: previewsName, source: previewsSource },
	{ name: simpleName, source: simpleSource },
	{ name: brandDarkName, source: brandDarkSource },
	{ name: brandLightName, source: brandLightSource },
	{ name: dynamicName, source: dynamicSource }
];
