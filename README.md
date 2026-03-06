# color-testing

A vibed-out playground project for testing color schemes. Built with SvelteKit and Tailwind CSS. Visualize color combinations as a contrast matrix, check WCAG accessibility levels, and preview typography and UI elements across your palette.

## Features

- Contrast ratio matrix for all foreground/background combinations
- WCAG 2.1 compliance levels (AA, AAA) for normal and large text
- Detailed preview dialog with font weights, sizes, UI elements, and shapes
- Foreground opacity slider for testing semi-transparent text
- Color vision deficiency simulation (protanopia, deuteranopia, tritanopia, etc.)
- Multiple color scheme support with easy scheme file authoring
- Markdown table export for documentation

## Adding a color scheme

Create a new file in `src/lib/schemes/` exporting a `ColorGroup[]` array. See existing schemes like `ocean.ts` or `catppuccin-mocha.ts` for reference.

## Development

```sh
bun install
bun run dev
```

## Building

```sh
bun run build
bun run preview
```

Deployed to GitHub Pages via GitHub Actions on push to `master`.
