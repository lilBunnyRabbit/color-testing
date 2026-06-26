/**
 * Barrel: importing this registers every model as a side effect. Order only
 * matters for flat-channel-key precedence (first registration wins).
 */
import './root';
import './oklch';
import './hsl';
import './srgb';
