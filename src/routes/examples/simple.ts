export const name = 'Simple';

export const source = `// Try changing the brand color!
brand = hex("#6c5ce7")

bg = OKLCH(0.97, brand.ok_c * 0.15, brand.ok_h)
fg = HSL(brand.h, 0.12, 0.18)
muted = fg.lighten(0.45)
surface = bg.darken(0.04)

accent = brand.rotate(150)
error = hex("#e74c3c")
success = HSL(155, 0.6, 0.38)`;
