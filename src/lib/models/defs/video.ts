/** Video / broadcast luma-chroma encodings. */
import { register, defineModel, type CuloriColor } from '../registry';
import { LAB_OPS } from '../families';
import { p } from '../util';

register(
	defineModel({
		id: 'yiq',
		label: 'YIQ (NTSC)',
		family: 'video',
		ctor: { name: 'YIQ', params: [p('y'), p('i'), p('q')], build: ([y, i, q]) => ({ mode: 'yiq', y, i, q }) as unknown as CuloriColor },
		channels: [
			{ key: 'yiq_y', localKey: 'y', label: 'Luma', culoriField: 'y', range: [0, 1] },
			{ key: 'yiq_i', localKey: 'i', label: 'In-phase', culoriField: 'i', range: [-0.6, 0.6] },
			{ key: 'yiq_q', localKey: 'q', label: 'Quadrature', culoriField: 'q', range: [-0.6, 0.6] }
		],
		inherit: LAB_OPS
	})
);
