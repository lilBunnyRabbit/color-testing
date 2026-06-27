export const name = 'Dynamic Theme';

export const source = `// One seed → a full accessible dark theme.
// Edit the seed and the whole scheme cascades.
seed = OKLCH(0.62, 0.15, 264)

// Surfaces from perceptual lightness, kept in gamut
bg      = seed.oklch.atLightness(0.16).oklch.gamutMap()
surface = seed.oklch.atLightness(0.21).oklch.gamutMap()
fg      = seed.oklch.atLightness(0.94).oklch.gamutMap()

// Brand + perceptual harmony (correct hues, not HSL)
primary   = seed.oklch.gamutMap()
secondary = seed.oklch.rotateHue(150).oklch.gamutMap()
accent    = seed.oklch.rotateHue(-60).oklch.gamutMap()

// Semantic, locked to the brand lightness/chroma
success = OKLCH(primary.ok_l, primary.ok_c, 145).oklch.gamutMap()
warning = OKLCH(primary.ok_l, primary.ok_c, 75).oklch.gamutMap()
error   = OKLCH(primary.ok_l, primary.ok_c, 28).oklch.gamutMap()
info    = OKLCH(primary.ok_l, primary.ok_c, 240).oklch.gamutMap()

// Background scale
bg_dark  = bg.darken(0.04)
bg_light = bg.lighten(0.05)

// Auto-pick a readable foreground for primary buttons
primary_fg = primary.srgb.contrastWCAG(bg) >= 4.5 ? bg : fg

// Live accessibility check (a boolean in the inspector)
aa_text = fg.srgb.contrastWCAG(bg) >= 4.5`;
