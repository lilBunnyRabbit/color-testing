# CLAUDE.md

Guidance for working in this repo. **Keep it current** — see _Maintaining this file_ at the bottom.

## What this is

**Chromatics** — a scriptable **color language** (a small JS-subset DSL) plus an **interactive studio** for designing, analyzing and exploring color. Write a tiny program that derives a whole palette from one brand color; inspect any color across ~100 color models; check accessibility; preview it on real UI — all in the browser. Stored canonically in **OKLCH**; every other space is a lazy [culori](https://culorijs.org/) projection.

Also shipped **as a library**: the color engine under `src/lib/models` is exported as a Svelte package (culori sits behind one seam, the registry).

## Stack

SvelteKit 2 + **Svelte 5 runes** + TypeScript + **Bun** + CodeMirror 6 + culori + Tailwind v4 + `adapter-static` (static SPA, deployed to GitHub Pages on push to `master`).

## Commands / gates

Run from the **repo root** (the Bash shell cwd can drift into subdirs — `cd` first):

```sh
bun install
bun run dev            # dev server
bun test               # unit tests (bun:test) — currently 238 across 19 files
bun run check          # svelte-kit sync + svelte-check (expect 0 errors / 0 warnings)
bunx vite build        # static build → build/  (also: bun run build)
bun run format         # prettier --write
```

Before calling any change done: **`bun test` + `bun run check` + `bunx vite build` all green.** Note: Bun resolves `./x.js` imports to `x.ts`.

## Architecture

### Color engine — `src/lib/models/`

The hybrid "A+C" design. Immutable, OKLCH-stored color values + a data-driven model registry + one runtime view class.

- `value.ts` — `ColorValue` (immutable; canonical `_oklch`; lazy `project(mode)` cache; `channel`/`view`/`member` dispatch; `.hex/.inGamut/.gamutMapped/.toCSS`). **Channel accessors and per-model views (`c.oklch`, `c.lab`, `c.ok_h`, …) are resolved dynamically at runtime via `member()` — they are NOT on the static TS type.** In typed `.ts`/`.svelte` code, `c.oklch.lighten(…)` will fail `svelte-check`; only the DSL evaluator reaches them. If you need a value's hex in component code, derive it through the DSL (`evaluate`) or use typed methods.
- `view.ts` — `ModelView`, the single runtime class (channel → method → cross-model re-entry).
- `registry.ts` — the **only** culori importer; `toMode/getModel/allModels/CHANNELS/register/defineModel` + gamut helpers.
- `types.ts`, `families.ts`, `util.ts` — model/method/channel defs, op-tables + factories, coercions.
- `defs/*.ts` — one file (or group) per model; `defs/index.ts` barrel side-effect-registers all. `modes/` holds custom culori modes.
- **~100 registered models & systems** (stable + experimental + coming-soon stubs). Adding a model is a pure data file that auto-surfaces everywhere via the DSL manifest (proven by an anti-drift test).

### DSL — `src/lib/dsl/`

- `evaluator.ts` — acorn parse → controlled AST walk (no raw `eval`); per-statement try/catch; returns `EvalResult`.
- `environment.ts` — constructors generated from `manifest.constructors` + free fns (`mix`/`contrast`/`deltaE`/math).
- `manifest.ts` — **the single source of truth**: constructors/builtins/members/docs, built from `allModels()` + `CHANNELS`. An anti-drift test asserts everything stays in sync.
- `lang.ts` / `complete.ts` / `hover.ts` / `swatch-deco.ts` / `editor-bindings.ts` — CodeMirror language, autocomplete, hover docs, inline color markers, and the bindings the editor consumes.
- `preview.ts` — `preview.*` primitives that render as cards. `components.ts` / `tokens.ts` / `theme.ts` — `component.*` / `scale.*`+`token()` / `theme()` namespaces for the styleguide.
- `model-docs.ts`, `channel-docs.ts`, `encyclopedia.ts` — vault-distilled copy for docs & `/models`.
- `color.ts` — **legacy**, kept only as a test parity oracle; dead in the app.

### Other libs

- `analysis/` — `contrast`/`wcag`/`apca` (WCAG 2 + APCA), `cvd` (color-vision sim), `similarity` (ΔE), `print` (CMYK proof), `quantize` (image→palette).
- `scheme/` — `adapter` (`EvalResult`→`Scheme`), `roles` (role mapping + audit), `tokens`, `components`, `theme-config`.
- `export/` — CSS / DTCG / Tailwind / Markdown (`index.ts`), swatch SVG/PNG (`swatch.ts`), styleguide (`styleguide.ts`).
- `mixer/engine.ts` — shared by `/mixer` and `/models`. `render/resolve.ts` — shared ref resolver.
- `persistence/` — `documents` (the per-doc store: `DocEnvelope`s keyed by a stable id + a rebuildable index; debounced autosave, idempotent migration, library import/export — pure & unit-tested), `url-hash` (shareable links), `local-storage` (first-run welcome flag). Keys: `chromatics:doc:<id>`, `chromatics:index`, `chromatics:active`, `chromatics:schema`, `chromatics:theme`, `chromatics:ui`, `chromatics:welcomed`. Legacy `chromatics:last` / `chromatics:scheme:<name>` are migrated into documents on first load (left in place one release as a safety copy).

### State — `src/lib/state/` (runes singletons)

- `app.svelte.ts` — `app`: `source` → `result` → `scheme`, then all the `$derived` role/token/component/audit state. **No panel mutates the scheme**; everything downstream is derived.
- `docs.svelte.ts` — `docs`: the active document + a recency `index`. Owns the single debounced autosave effect (gated on `docs.hydrated`) that writes `app.source` **plus** the per-doc Preview/Studio/Styleguide settings (`roles`/`opacities`/`visionSim`/`fgOpacity`) back to the active doc's own slot, and the new/open/rename/delete/duplicate/import/export lifecycle. `app.source` stays the single editable root; `docs` is the persistence seam around it.
- `ui.svelte.ts` — `ui`: theme, resizable/collapsible editor, active `Tab`, swatch mode, and the `mounted`/`isMobile` viewport gate.
- `welcome.svelte.ts` — `welcome.open` for the first-run showcase modal.

### UI — `src/routes/` + `src/lib/components/`

- `+layout.svelte` — applies/persists theme + ui prefs; flips `ui.isMobile` via `matchMedia` **after mount** (SSR/first render stays desktop → no hydration mismatch); renders the global `<Welcome/>`.
- `+page.svelte` — mount-gated shell chooser: `DesktopShell` vs mobile `MobileShell`.
- `DesktopShell.svelte` — top bar (`DocControls`, Share, Mixer/Models links, API docs, **?** welcome, theme) + drag-resizable/collapsible editor + tabbed analysis pane.
- `DocControls.svelte` — shared document bar/sheet (`variant: 'bar' | 'sheet'`): recency switcher, inline rename, Saved/Saving chip, Save/New, new-from-template, duplicate, delete-with-confirm, library import/export, storage + cross-tab chips. Driven entirely by the `docs` store; used by both shells so save UX never drifts.
- Analysis tabs (shared by both shells via `ui.tab`): **Inspector · Studio · Preview · Styleguide · Matrix · Validate · 3D Explore (`ModelViewer`) · Export**. Plus `Docs.svelte` (DSL reference overlay).
- `components/mobile/` — `MobileShell` + `BottomTabBar` (5 slots) + `MoreSheet` (overflow + app actions) + `MobileEditorSheet` + `Sheet`.
- `Welcome.svelte` — first-run **welcome showcase modal** (rendered in `+layout`). Hero "color as code" card + a feature grid; each card jumps to the relevant tab/route and loads a tailored example. Auto-opens once (`hasWelcomed`/`markWelcomed`), re-openable from the **?** button in every header. A11y: `role=dialog`, focus trap, Esc/backdrop close, body-scroll lock.

### Routes

| Route     | What                                                     |
| --------- | -------------------------------------------------------- |
| `/`       | The studio — editor + analysis tabs                      |
| `/models` | Interactive encyclopedia of all color models & systems   |
| `/mixer`  | Cross-model mixer — one color, every model, live sliders |

Examples live in `src/routes/examples/` (Simple, Conversions, Showcase, Previews, Design System, Brand Dark/Light, Dynamic Theme); `examples/index.ts` orders them (first = default on load).

## Gotchas

- **`package.json` `sideEffects` must keep `"**/models/**"`** — otherwise the model registry is tree-shaken out and the static build crashes on boot (`No constructor registered for oklch`).
- Run gates from the repo **root**.
- Dynamic color accessors (`.oklch`, `.ok_h`, …) don't exist on the static type — see the engine note above.
- Theme/mobile detection happens **only after mount** on purpose; don't read `matchMedia`/`localStorage` during render.
- Conventional-commit titles + short bullet bodies; **no AI/Claude self-attribution** in commits.

## Maintaining this file

Treat CLAUDE.md as living docs. **After any change that alters the points above** — new/removed route, tab, lib module, state store, persistence key, gate/command, or a new gotcha — update the relevant section in the same change. Keep it concise (orientation, not exhaustive); avoid brittle specifics that rot (prefer "see `/models`" over hard counts where you can). When a test/model count is cited, refresh it from the last gate run.
