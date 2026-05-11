import type { MarkdownPostProcessorContext } from "obsidian";
import { parseQuantity } from "../core/scaler";
import type { Quantity } from "../core/types";
import type { ScalerRegistry, ScopeId } from "../registry/scaler-registry";

export interface FoundQuantity {
  span: HTMLSpanElement;
  quantity: Quantity;
}

const QUANTITY_RE = /\{([^{}\n]+)\}/g;

export function replaceQuantitiesInTextNodes(
  root: Node
): FoundQuantity[] {
  const results: FoundQuantity[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      let parent: Node | null = node.parentNode;
      while (parent) {
        if (parent instanceof Element) {
          if (parent.classList?.contains("recipe-scaler-qty")) {
            return NodeFilter.FILTER_REJECT;
          }
          if (parent.classList?.contains("recipe-scaler-widget")) {
            return NodeFilter.FILTER_REJECT;
          }
        }
        parent = parent.parentNode;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const toProcess: Text[] = [];
  let current: Node | null = walker.nextNode();
  while (current) {
    toProcess.push(current as Text);
    current = walker.nextNode();
  }

  for (const textNode of toProcess) {
    const text = textNode.nodeValue ?? "";
    QUANTITY_RE.lastIndex = 0;
    if (!QUANTITY_RE.test(text)) continue;
    QUANTITY_RE.lastIndex = 0;

    const frag = document.createDocumentFragment();
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = QUANTITY_RE.exec(text)) !== null) {
      const inner = match[1];
      const quantity = parseQuantity(inner);
      if (!quantity) continue;

      const before = text.slice(lastIndex, match.index);
      if (before) frag.appendChild(document.createTextNode(before));

      const span = document.createElement("span");
      span.className = "recipe-scaler-qty";
      span.title = `Original: ${quantity.raw}`;
      span.textContent = quantity.raw;
      frag.appendChild(span);
      results.push({ span, quantity });

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex === 0) continue;
    const after = text.slice(lastIndex);
    if (after) frag.appendChild(document.createTextNode(after));
    textNode.parentNode?.replaceChild(frag, textNode);
  }

  return results;
}

export interface PostProcessorDeps {
  registry: ScalerRegistry;
  resolveScope: (sourcePath: string) => ScopeId;
}

export function createPostProcessor(deps: PostProcessorDeps) {
  return (el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
    const scopeId = deps.resolveScope(ctx.sourcePath);
    const quantities = replaceQuantitiesInTextNodes(el);
    for (const { span, quantity } of quantities) {
      // baseServings=1 is a placeholder — the registry uses the value supplied
      // by registerUI (from the recipe-scaler code block) as authoritative.
      deps.registry.registerSpan(scopeId, span, quantity, 1);
    }
  };
}
