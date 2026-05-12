# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an **Obsidian plugin** that dynamically scales recipe quantities in markdown notes and canvas files. Users wrap quantities in `{...}` braces (e.g., `{100 ml}`, `{1-2 cups}`) and a `recipe-scaler` code block widget provides a servings input that re-scales all quantities in real-time.

## Commands

```bash
npm run dev           # Watch build (esbuild, inline sourcemaps)
npm run build         # Production build (minified)
npm run test          # Run all Vitest tests once
npm run test:watch    # Watch mode for tests
npm run lint          # ESLint on src/
npm run build:install # Build + copy to example vault
```

Run a single test file:
```bash
npx vitest run src/core/scaler.test.ts
```

## Architecture

The plugin uses **dependency injection** with `main.ts` as the composition root. Six modules have clear separation of concerns:

### Data Flow
1. **Note/Canvas opens** → `CanvasResolver` updates its file-to-canvas mapping
2. **Note renders** → `PostProcessor` (TreeWalker) finds `{...}` spans, registers them with `ScalerRegistry`
3. **Code block renders** → `CodeBlockProcessor` creates the servings widget, registers the UI with `ScalerRegistry`
4. **User changes servings** → `ScalerRegistry.setServings()` re-scales all registered spans in the scope
5. **Note/Canvas closes** → `CanvasResolver` triggers `ScalerRegistry.cleanupScope()`

### Module Responsibilities

| Module | Responsibility |
|--------|---------------|
| `src/core/` | Pure parsing and scaling logic — no Obsidian or DOM dependencies |
| `src/registry/` | Stateful map of `ScopeId → { spans, UI, baseServings }` |
| `src/render/` | Obsidian integration: code block processor, post-processor, canvas resolver |
| `src/ui/` | Single DOM widget factory (`createScalerWidget`) |
| `src/settings/` | Settings types and Obsidian settings tab UI |
| `src/main.ts` | Plugin lifecycle, creates all instances, wires dependencies |

### Scope Isolation
Each open note or canvas is an independent scaling context (scope). The `CanvasResolver` maps markdown file paths to their canvas if open, producing scope IDs like `canvas:/path/to.canvas` or `note:/path/to.md`. This allows the same markdown file in multiple canvases to scale independently.

### Key Invariants
- **Format-preserving:** `scaleNumber()` keeps the original decimal separator (`,` vs `.`) and strips trailing zeros.
- **Plural pairs** are user-configurable in settings and applied to scaled (not original) values. Only registered units are pluralized; others pass through unchanged.
- **Registry filters disconnected DOM nodes** before re-rendering to prevent memory leaks.
- **`registerUI()` is authoritative for `baseServings`** — code block processors set this; post-processors only register spans.
- **Canvas JSON** is parsed from `.canvas` files on layout changes; failures are silently swallowed.

## Testing

Tests use **Vitest + jsdom**. Obsidian API is mocked at `src/__mocks__/obsidian.ts`. Each module has a co-located test file. The `example-vault/` directory contains a real Obsidian vault used with `npm run build:install` for manual testing.

## Build Output

esbuild bundles everything into `main.js` (CommonJS). Obsidian, CodeMirror, and other Obsidian-native packages are declared `external` in `esbuild.config.mjs` and not bundled.
