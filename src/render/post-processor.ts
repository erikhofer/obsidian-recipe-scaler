import type { MarkdownPostProcessorContext } from "obsidian";
import { parseQuantity } from "../core/scaler";
import type { Quantity } from "../core/types";
import type { ScalerRegistry, ScopeId } from "../registry/scaler-registry";
import { createScalerWidget } from "../ui/scaler-widget";

export interface FoundTag {
  el: Element;
  baseServings: number;
  malformed: boolean;
}

export interface FoundQuantity {
  span: HTMLSpanElement;
  quantity: Quantity;
}

const SCALER_TAG_NAME = "recipe-scaler";
const QUANTITY_RE = /\{([^{}\n]+)\}/g;

export function findScalerTags(root: ParentNode): FoundTag[] {
  const els = Array.from(root.querySelectorAll(SCALER_TAG_NAME));
  return els.map((el) => {
    const raw = el.getAttribute("baseservings");
    const parsed = raw === null ? NaN : parseInt(raw, 10);
    const valid = Number.isFinite(parsed) && parsed >= 1;
    return {
      el,
      baseServings: valid ? parsed : 1,
      malformed: !valid,
    };
  });
}

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
          if (parent.tagName.toLowerCase() === SCALER_TAG_NAME) {
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

    const tags = findScalerTags(el);
    let firstHandled = false;
    let baseServings = 1;
    for (const tag of tags) {
      if (!firstHandled) {
        firstHandled = true;
        baseServings = tag.baseServings;
        const widget = createScalerWidget({
          baseServings: tag.baseServings,
          onChange: () => {
            /* registry handles update via input change listener */
          },
        });
        tag.el.replaceWith(widget);
        const input = widget.querySelector("input") as HTMLInputElement;
        deps.registry.registerUI(scopeId, input, tag.baseServings, () => {});
        if (tag.malformed) {
          console.warn(
            "[recipe-scaler] missing or invalid baseServings; defaulted to 1"
          );
        }
      } else {
        const warn = document.createElement("span");
        warn.className = "recipe-scaler-warning";
        warn.textContent = "⚠ extra recipe-scaler tag ignored";
        tag.el.replaceWith(warn);
      }
    }

    const quantities = replaceQuantitiesInTextNodes(el);
    for (const { span, quantity } of quantities) {
      deps.registry.registerSpan(scopeId, span, quantity, baseServings);
    }
  };
}
