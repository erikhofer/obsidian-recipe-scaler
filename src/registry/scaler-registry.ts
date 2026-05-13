import { renderScaled } from "../core/scaler";
import type { Quantity, PluralPair } from "../core/types";

export class ScalerRegistry {
  private quantities = new WeakMap<HTMLElement, Quantity>();
  private getPairs: () => PluralPair[];

  constructor(getPairs: () => PluralPair[]) {
    this.getPairs = getPairs;
  }

  rememberSpan(span: HTMLElement, quantity: Quantity): void {
    this.quantities.set(span, quantity);
    span.textContent = quantity.raw;
  }

  applyServings(
    widget: HTMLElement,
    servings: number,
    baseServings: number
  ): number {
    const root = findScopeRoot(widget);
    const spans = root.querySelectorAll<HTMLElement>(".recipe-scaler-qty");
    const factor = servings / baseServings;
    const pairs = this.getPairs();
    let updated = 0;
    spans.forEach((span) => {
      const q = this.quantities.get(span);
      if (!q) return;
      span.textContent = renderScaled(q, factor, pairs);
      updated++;
    });
    return updated;
  }
}

// The workspace leaf is the natural scope boundary in Obsidian: a canvas
// leaf contains the widget node and all embedded-file nodes; a markdown
// leaf contains a single rendered note. Splits and popouts each get their
// own leaf, so the same file can scale independently in multiple views.
function findScopeRoot(el: HTMLElement): HTMLElement {
  return el.closest<HTMLElement>(".workspace-leaf-content") ?? document.body;
}
