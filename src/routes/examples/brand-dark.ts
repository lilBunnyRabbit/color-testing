export const name = 'Brand Dark';

export const source = `// ── Source ──
bg = OKLCH(0.255, 0.0233, 230.47)

// ── Core ──
fg = OKLCH(1 - bg.ok_l, bg.ok_c / 3, (bg.ok_h + 180) % 360)
primary = OKLCH(fg.ok_l, bg.ok_c * 3, (fg.ok_h + 72) % 360)
secondary = OKLCH(primary.ok_l, primary.ok_c, (primary.ok_h + 180) % 360)
accent = OKLCH(primary.ok_l, primary.ok_c, fg.ok_h)

// ── Background scale ──
bg_lightest = bg.lighten(0.11)
bg_lighter = bg.lighten(0.073)
bg_light = bg.lighten(0.037)
bg_dark = bg.darken(0.037)
bg_darker = bg.darken(0.073)
bg_darkest = bg.darken(0.11)

// ── Semantic ──
success = OKLCH(primary.ok_l, primary.ok_c * 2, 140)
warning = OKLCH(primary.ok_l, primary.ok_c * 2, 70)
error = OKLCH(primary.ok_l, primary.ok_c * 2, 30)
info = OKLCH(primary.ok_l, primary.ok_c * 2, 240)

// ── Harmony ──
triad_a = primary.rotate(-120)
triad_b = primary.rotate(120)
split_a = primary.rotate(150)
split_b = primary.rotate(210)`;
