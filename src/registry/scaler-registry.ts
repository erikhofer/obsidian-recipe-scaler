import { renderScaled } from "../core/scaler";
import type { Quantity, PluralPair } from "../core/types";

export type ScopeId = string;

interface ScopeState {
  baseServings: number;
  currentServings: number;
  spans: Array<{ el: HTMLElement; quantity: Quantity }>;
}

export class ScalerRegistry {
  private scopes = new Map<ScopeId, ScopeState>();
  private getPairs: () => PluralPair[];

  constructor(getPairs: () => PluralPair[]) {
    this.getPairs = getPairs;
  }

  private getOrCreate(id: ScopeId, baseServings: number): ScopeState {
    let scope = this.scopes.get(id);
    if (!scope) {
      scope = {
        baseServings,
        currentServings: baseServings,
        spans: [],
      };
      this.scopes.set(id, scope);
    }
    return scope;
  }

  registerSpan(
    id: ScopeId,
    el: HTMLElement,
    quantity: Quantity,
    baseServings: number
  ): void {
    const scope = this.getOrCreate(id, baseServings);
    scope.spans.push({ el, quantity });
    const factor = scope.currentServings / scope.baseServings;
    el.textContent = renderScaled(quantity, factor, this.getPairs());
  }

  registerUI(
    id: ScopeId,
    input: HTMLInputElement,
    baseServings: number,
    onChange: (value: number) => void,
    // Optional lazy resolver: called at interaction time instead of render time.
    // Fixes canvas/note scope-ID timing mismatch (async CanvasResolver.refresh()).
    resolveScope?: () => ScopeId
  ): void {
    const scope = this.getOrCreate(id, baseServings);
    // registerUI is authoritative for baseServings; correct any value set by
    // earlier registerSpan calls that arrived before the UI tag's chunk.
    scope.baseServings = baseServings;
    scope.currentServings = baseServings;
    input.addEventListener("change", () => {
      const currentId = resolveScope ? resolveScope() : id;
      if (currentId !== id) {
        // Scope resolved to a different ID at interaction time (e.g. canvas/note
        // timing mismatch). Make that scope authoritative for baseServings too.
        const resolvedScope = this.getOrCreate(currentId, baseServings);
        resolvedScope.baseServings = baseServings;
      }
      let v = parseInt(input.value, 10);
      if (!Number.isFinite(v) || v < 1) v = 1;
      input.value = String(v);
      onChange(v);
      this.setServings(currentId, v);
    });
  }

  setServings(id: ScopeId, value: number): void {
    const scope = this.scopes.get(id);
    if (!scope) return;
    scope.currentServings = value;
    const factor = value / scope.baseServings;
    scope.spans = scope.spans.filter((s) => s.el.isConnected);
    const pairs = this.getPairs();
    for (const { el, quantity } of scope.spans) {
      el.textContent = renderScaled(quantity, factor, pairs);
    }
  }

  cleanupScope(id: ScopeId): void {
    this.scopes.delete(id);
  }
}
