import { describe, it, expect, beforeEach } from "vitest";
import { replaceQuantitiesInTextNodes } from "./post-processor";

describe("replaceQuantitiesInTextNodes", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("replaces a single {…} with a span containing the parsed quantity", () => {
    document.body.innerHTML = "<p>Add {100 ml} olive oil</p>";
    const results = replaceQuantitiesInTextNodes(document.body);
    expect(results.length).toBe(1);
    expect(results[0].span.textContent).toBe("100 ml");
    expect(results[0].quantity.unit).toBe("ml");

    expect(document.body.textContent).toBe("Add 100 ml olive oil");
    expect(document.body.querySelectorAll("span").length).toBe(1);
  });

  it("handles multiple matches in the same text node", () => {
    document.body.innerHTML = "<p>{2 cups} flour, {3 cloves} garlic</p>";
    const results = replaceQuantitiesInTextNodes(document.body);
    expect(results.length).toBe(2);
    expect(results[0].quantity.unit).toBe("cups");
    expect(results[1].quantity.unit).toBe("cloves");
  });

  it("leaves unparseable {…} untouched", () => {
    document.body.innerHTML = "<p>{see above} and {100 ml} oil</p>";
    const results = replaceQuantitiesInTextNodes(document.body);
    expect(results.length).toBe(1);
    expect(document.body.textContent).toContain("{see above}");
  });

  it("does not recurse into already-replaced spans", () => {
    document.body.innerHTML = "<p>{100 ml}</p>";
    replaceQuantitiesInTextNodes(document.body);
    const second = replaceQuantitiesInTextNodes(document.body);
    expect(second.length).toBe(0);
  });

  it("ignores text inside the scaler widget", () => {
    document.body.innerHTML =
      '<span class="recipe-scaler-widget">{100 ml}</span>';
    const results = replaceQuantitiesInTextNodes(document.body);
    expect(results.length).toBe(0);
  });
});
