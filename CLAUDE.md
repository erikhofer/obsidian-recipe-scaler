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

The plugin uses **dependency injection** with `main.ts` as the composition root.

### Data Flow
1. **Note/Canvas renders** → `PostProcessor` (TreeWalker) finds `{...}` text, wraps each match in a `.recipe-scaler-qty` span, and calls `ScalerRegistry.rememberSpan(span, quantity)` which stores the parsed `Quantity` in a `WeakMap<HTMLElement, Quantity>`.
2. **Code block renders** → `CodeBlockProcessor` creates the servings widget. The widget's `onChange` calls `ScalerRegistry.applyServings(widget, servings, baseServings)`.
3. **User changes servings** → `applyServings` walks up from the widget to `.workspace-leaf-content`, queries all `.recipe-scaler-qty` descendants, and re-renders each from its stored `Quantity` and the new factor.

### Module Responsibilities

| Module | Responsibility |
|--------|---------------|
| `src/core/` | Pure parsing and scaling logic — no Obsidian or DOM dependencies |
| `src/registry/` | `ScalerRegistry`: stores per-span `Quantity` in a `WeakMap`; applies scaling to all spans in the widget's leaf-content scope on demand |
| `src/render/` | Obsidian integration: code block processor and post-processor |
| `src/ui/` | Single DOM widget factory (`createScalerWidget`) |
| `src/settings/` | Settings types and Obsidian settings tab UI |
| `src/main.ts` | Plugin lifecycle, creates all instances, wires dependencies |

### Scope: the workspace leaf
The scope of a scaling interaction is the nearest `.workspace-leaf-content` ancestor of the widget. This is the natural boundary in Obsidian: a canvas leaf contains the widget node and all embedded-file nodes; a markdown leaf contains a single rendered note; splits and popouts each get their own leaf. The widget and the spans don't need any shared identifier — they're linked purely by DOM containment, resolved at interaction time when the DOM is settled. (Earlier designs used `ctx.sourcePath`-based scope IDs, but that can't link a canvas's widget — typically in a canvas text node — with spans in *different* embedded markdown files.)

### Key Invariants
- **Format-preserving:** `scaleNumber()` keeps the original decimal separator (`,` vs `.`) and strips trailing zeros.
- **Plural pairs** are user-configurable in settings and applied to scaled (not original) values. Only registered units are pluralized; others pass through unchanged.
- **Spans store their original `Quantity`** in a `WeakMap` keyed by the span element — detached spans are garbage-collected automatically; `applyServings` ignores spans no longer in the leaf via `querySelectorAll`.
- **DOM walks happen only at user-interaction time**, never during render. Obsidian's post-processors receive detached DOM fragments, so any `el.contains(...)` check at render time is unreliable.

## Testing

Tests use **Vitest + jsdom**. Obsidian API is mocked at `src/__mocks__/obsidian.ts`. Each module has a co-located test file. The `example-vault/` directory contains a real Obsidian vault used with `npm run build:install` for manual testing.

## Build Output

esbuild bundles everything into `main.js` (CommonJS). Obsidian, CodeMirror, and other Obsidian-native packages are declared `external` in `esbuild.config.mjs` and not bundled.
