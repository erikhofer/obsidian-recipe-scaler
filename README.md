# Recipe Scaler

Obsidian plugin that scales recipe quantities dynamically by serving size, in notes and canvases.

## Usage

Add a `recipe-scaler` code block at the top of a recipe note, then wrap quantities in curly braces:

````markdown
```recipe-scaler
baseServings: 4
```

- {2 cups} flour
- {3 cloves} garlic
- {1-2 pinches} salt
````

Switch the note to Reading View. The code block becomes an input — change the servings and every `{…}` updates inline.

In a canvas: place the code block in any text node and reference recipe `.md` files as canvas file nodes. The scaler controls all quantities across all nodes in the canvas.

## Singular/Plural

The plugin starts with an empty pair list. Add pairs in Settings → Recipe Scaler. Suggested:

- `cup` / `cups`
- `tablespoon` / `tablespoons`
- `teaspoon` / `teaspoons`
- `clove` / `cloves`
- `pinch` / `pinches`

When a scaled value equals exactly 1, the singular form is used; otherwise the plural. Mass and volume units (ml, g, kg, l) don't need pairs.

## Development

```bash
npm install
npm run dev        # watch build
npm test           # unit tests
npm run build      # production build
npm run build:install  # build + copy into example-vault
```

The example vault under `example-vault/` contains a single-note recipe (`Pizza Marinara.md`) and a canvas (`Three-Course Dinner.canvas`).

## Limitations

- Reading View and Canvas only — Live Preview not supported.
- The original markdown is never modified; scaled values are display-only.
- Number formats supported: integers, decimals (comma or dot), and ranges (`100-200`). Fractions like `1/2` are not parsed.
