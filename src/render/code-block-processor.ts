import type { MarkdownPostProcessorContext } from "obsidian";
import type { ScalerRegistry } from "../registry/scaler-registry";
import { createScalerWidget } from "../ui/scaler-widget";

export interface CodeBlockProcessorDeps {
  registry: ScalerRegistry;
}

export interface ParsedScalerBlock {
  baseServings: number;
  malformed: boolean;
}

export function parseScalerCodeBlock(source: string): ParsedScalerBlock {
  for (const line of source.split("\n")) {
    const m = /^\s*baseServings\s*:\s*(\d+)\s*$/i.exec(line);
    if (m) {
      const n = parseInt(m[1], 10);
      if (Number.isFinite(n) && n >= 1) {
        return { baseServings: n, malformed: false };
      }
    }
  }
  return { baseServings: 1, malformed: true };
}

export function createCodeBlockProcessor(deps: CodeBlockProcessorDeps) {
  return (
    source: string,
    el: HTMLElement,
    _ctx: MarkdownPostProcessorContext
  ) => {
    const { baseServings, malformed } = parseScalerCodeBlock(source);

    if (malformed) {
      console.warn(
        "[recipe-scaler] missing or invalid baseServings in code block; defaulted to 1"
      );
    }

    while (el.firstChild) el.removeChild(el.firstChild);
    const widget = createScalerWidget({
      baseServings,
      onChange: (servings: number) => {
        deps.registry.applyServings(widget, servings, baseServings);
      },
    });
    el.appendChild(widget);
  };
}
