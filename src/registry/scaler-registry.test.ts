import { describe, it, expect, beforeEach } from "vitest";
import { ScalerRegistry } from "./scaler-registry";
import { parseQuantity } from "../core/scaler";
import type { PluralPair } from "../core/types";

describe("ScalerRegistry", () => {
  const pairs: PluralPair[] = [
    { singular: "cup", plural: "cups" },
    { singular: "clove", plural: "cloves" },
  ];
  let registry: ScalerRegistry;

  beforeEach(() => {
    document.body.innerHTML = "";
    registry = new ScalerRegistry(() => pairs);
  });

  function makeLeaf(): HTMLElement {
    const leaf = document.createElement("div");
    leaf.className = "workspace-leaf-content";
    document.body.appendChild(leaf);
    return leaf;
  }

  function makeSpan(parent: HTMLElement, raw: string): HTMLElement {
    const s = document.createElement("span");
    s.className = "recipe-scaler-qty";
    parent.appendChild(s);
    registry.rememberSpan(s, parseQuantity(raw)!);
    return s;
  }

  it("rememberSpan renders the raw text initially", () => {
    const leaf = makeLeaf();
    const s = makeSpan(leaf, "2 cups");
    expect(s.textContent).toBe("2 cups");
  });

  it("applyServings updates all spans within the widget's leaf", () => {
    const leaf = makeLeaf();
    const s1 = makeSpan(leaf, "2 cups");
    const s2 = makeSpan(leaf, "3 cloves");
    const widget = document.createElement("span");
    leaf.appendChild(widget);

    const n = registry.applyServings(widget, 8, 4);

    expect(s1.textContent).toBe("4 cups");
    expect(s2.textContent).toBe("6 cloves");
    expect(n).toBe(2);
  });

  it("pluralizes correctly when scaling down", () => {
    const leaf = makeLeaf();
    const s = makeSpan(leaf, "2 cups");
    const widget = document.createElement("span");
    leaf.appendChild(widget);
    registry.applyServings(widget, 2, 4);
    expect(s.textContent).toBe("1 cup");
  });

  it("does not affect spans in a different leaf", () => {
    const leafA = makeLeaf();
    const leafB = makeLeaf();
    const sA = makeSpan(leafA, "2 cups");
    const sB = makeSpan(leafB, "3 cloves");
    const widget = document.createElement("span");
    leafA.appendChild(widget);

    registry.applyServings(widget, 8, 4);

    expect(sA.textContent).toBe("4 cups");
    expect(sB.textContent).toBe("3 cloves");
  });

  it("updates spans in sibling sub-containers (canvas widget + embedded-note spans)", () => {
    // Regression for the canvas case: widget lives in one canvas node,
    // spans live in OTHER canvas nodes (embedded markdown files). They
    // all share the same workspace-leaf-content.
    const canvasLeaf = makeLeaf();
    const widgetNode = document.createElement("div");
    canvasLeaf.appendChild(widgetNode);
    const embedA = document.createElement("div");
    canvasLeaf.appendChild(embedA);
    const embedB = document.createElement("div");
    canvasLeaf.appendChild(embedB);

    const sA = makeSpan(embedA, "2 cups");
    const sB = makeSpan(embedB, "3 cloves");

    const widget = document.createElement("span");
    widgetNode.appendChild(widget);

    registry.applyServings(widget, 8, 4);

    expect(sA.textContent).toBe("4 cups");
    expect(sB.textContent).toBe("6 cloves");
  });

  it("skips detached spans", () => {
    const leaf = makeLeaf();
    const s1 = makeSpan(leaf, "2 cups");
    const s2 = makeSpan(leaf, "3 cloves");
    s2.remove();

    const widget = document.createElement("span");
    leaf.appendChild(widget);
    const n = registry.applyServings(widget, 8, 4);

    expect(s1.textContent).toBe("4 cups");
    expect(s2.textContent).toBe("3 cloves");
    expect(n).toBe(1);
  });

  it("does nothing when widget has no enclosing leaf", () => {
    const widget = document.createElement("span");
    expect(() => registry.applyServings(widget, 8, 4)).not.toThrow();
  });
});
