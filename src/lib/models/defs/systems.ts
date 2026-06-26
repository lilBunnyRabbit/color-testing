/**
 * Named color systems (catalogs). Not numerically convertible by culori — these
 * are the @lilbunnyrabbit/chromatics package boundary: each advertises its
 * characteristic lookups (.nearest(), .code()) and throws an actionable error.
 */
import { register, defineModel } from '../registry';
import { method, unbacked } from '../util';

const SYSTEMS: { id: string; label: string }[] = [
	{ id: 'pantone', label: 'Pantone (PMS)' },
	{ id: 'munsell', label: 'Munsell' },
	{ id: 'ncs', label: 'NCS' },
	{ id: 'ral', label: 'RAL' },
	{ id: 'hks', label: 'HKS' },
	{ id: 'copic', label: 'Copic' },
	{ id: 'dic', label: 'DIC' },
	{ id: 'toyo', label: 'Toyo' },
	{ id: 'trumatch', label: 'Trumatch' }
];

for (const s of SYSTEMS) {
	register(
		defineModel({
			id: s.id,
			label: s.label,
			family: 'system',
			backed: false,
			ownMethods: [
				method('nearest', [], 'color', `Nearest ${s.label} swatch`, () => unbacked(s.label)),
				method('code', [], 'string', `${s.label} code / notation`, () => unbacked(s.label))
			]
		})
	);
}
