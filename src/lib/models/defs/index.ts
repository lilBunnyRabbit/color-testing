/**
 * Barrel: importing this registers every model as a side effect. Order only
 * matters for flat-channel-key precedence (first registration wins).
 */
import './root';
import './oklch';
import './oklab';
import './hsl';
import './hsv';
import './hwb';
import './cielab';
import './cielch';
import './srgb';
import './linear-srgb';
import './display-p3';
import './xyz';
// Extra backed models (wide-gamut RGB, more perceptual / hue / video spaces).
import './rgb-wide';
import './perceptual-extra';
import './hue-extra';
import './video';
// Deferred (backed:false) — advertise in docs/autocomplete, throw on use.
import './cmyk';
import './hct';
import './hsluv';
import './systems';
