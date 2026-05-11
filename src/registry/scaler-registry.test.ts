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

  function makeSpan(): HTMLElement {
    const s = document.createElement("span");
    document.body.appendChild(s);
    return s;
  }

  it("renders the base value on register", () => {
    const span = makeSpan();
    const q = parseQuantity("2 cups")!;
    registry.registerSpan("note:a.md", span, q, 4);
    expect(span.textContent).toBe("2 cups");
  });

  it("updates all spans in scope when setServings is called", () => {
    const s1 = makeSpan();
    const s2 = makeSpan();
    registry.registerSpan("note:a.md", s1, parseQuantity("2 cups")!, 4);
    registry.registerSpan("note:a.md", s2, parseQuantity("3 cloves")!, 4);

    registry.setServings("note:a.md", 8);

    expect(s1.textContent).toBe("4 cups");
    expect(s2.textContent).toBe("6 cloves");
  });

  it("pluralizes correctly on scale down", () => {
    const s1 = makeSpan();
    registry.registerSpan("note:a.md", s1, parseQuantity("2 cups")!, 4);
    registry.setServings("note:a.md", 2);
    expect(s1.textContent).toBe("1 cup");
  });

  it("does not cross scopes", () => {
    const s1 = makeSpan();
    const s2 = makeSpan();
    registry.registerSpan("note:a.md", s1, parseQuantity("2 cups")!, 4);
    registry.registerSpan("note:b.md", s2, parseQuantity("3 cloves")!, 4);

    registry.setServings("note:a.md", 8);

    expect(s1.textContent).toBe("4 cups");
    expect(s2.textContent).toBe("3 cloves");
  });

  it("prunes detached spans lazily on setServings", () => {
    const s1 = makeSpan();
    const s2 = makeSpan();
    registry.registerSpan("note:a.md", s1, parseQuantity("2 cups")!, 4);
    registry.registerSpan("note:a.md", s2, parseQuantity("3 cloves")!, 4);

    s1.remove();
    registry.setServings("note:a.md", 8);

    expect(s2.textContent).toBe("6 cloves");
    expect((registry as any).scopes.get("note:a.md").spans.length).toBe(1);
  });

  it("ignores setServings for unknown scope", () => {
    expect(() => registry.setServings("note:nope.md", 8)).not.toThrow();
  });

  it("cleanupScope removes scope state", () => {
    const s1 = makeSpan();
    registry.registerSpan("note:a.md", s1, parseQuantity("2 cups")!, 4);
    registry.cleanupScope("note:a.md");
    expect((registry as any).scopes.has("note:a.md")).toBe(false);
  });

  it("syncs UI input value to scope when registered", () => {
    const input = document.createElement("input");
    input.type = "number";
    document.body.appendChild(input);
    let received: number | null = null;
    registry.registerUI("note:a.md", input, 4, (v) => (received = v));

    input.value = "8";
    input.dispatchEvent(new Event("change"));

    expect(received).toBe(8);
  });
});
