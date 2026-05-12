import { describe, it, expect, beforeEach } from "vitest";
import { createScalerWidget } from "./scaler-widget";

describe("createScalerWidget", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("renders an input initialized to baseServings", () => {
    const widget = createScalerWidget({ baseServings: 4, onChange: () => {} });
    document.body.appendChild(widget);
    const input = widget.querySelector("input") as HTMLInputElement;
    expect(input.value).toBe("4");
    expect(input.type).toBe("number");
    expect(input.min).toBe("1");
  });

  it("calls onChange with the new integer value on input change", () => {
    let received: number | null = null;
    const widget = createScalerWidget({
      baseServings: 4,
      onChange: (v) => (received = v),
    });
    document.body.appendChild(widget);
    const input = widget.querySelector("input") as HTMLInputElement;
    input.value = "8";
    input.dispatchEvent(new Event("change"));
    expect(received).toBe(8);
  });

  it("clamps non-positive values to 1", () => {
    let received: number | null = null;
    const widget = createScalerWidget({
      baseServings: 4,
      onChange: (v) => (received = v),
    });
    document.body.appendChild(widget);
    const input = widget.querySelector("input") as HTMLInputElement;
    input.value = "0";
    input.dispatchEvent(new Event("change"));
    expect(received).toBe(1);
    expect(input.value).toBe("1");
  });

  it("reset button restores baseServings", () => {
    let received: number | null = null;
    const widget = createScalerWidget({
      baseServings: 4,
      onChange: (v) => (received = v),
    });
    document.body.appendChild(widget);
    const input = widget.querySelector("input") as HTMLInputElement;
    const reset = widget.querySelector("button") as HTMLButtonElement;
    input.value = "8";
    input.dispatchEvent(new Event("change"));
    reset.click();
    expect(received).toBe(4);
    expect(input.value).toBe("4");
  });

  it("has the expected wrapper class", () => {
    const widget = createScalerWidget({ baseServings: 4, onChange: () => {} });
    expect(widget.classList.contains("recipe-scaler-widget")).toBe(true);
  });

  it("dispatches a change event on reset (so registry listeners fire)", () => {
    const widget = createScalerWidget({ baseServings: 4, onChange: () => {} });
    document.body.appendChild(widget);
    const input = widget.querySelector("input") as HTMLInputElement;
    const reset = widget.querySelector("button") as HTMLButtonElement;
    let changeEvents = 0;
    input.addEventListener("change", () => { changeEvents++; });
    input.value = "8";
    reset.click();
    expect(input.value).toBe("4");
    expect(changeEvents).toBeGreaterThan(0);
  });

  it("renders a select with options 1–10", () => {
    const widget = createScalerWidget({ baseServings: 4, onChange: () => {} });
    document.body.appendChild(widget);
    const select = widget.querySelector("select") as HTMLSelectElement;
    expect(select).not.toBeNull();
    expect(select.options.length).toBe(10);
    expect(select.options[0].value).toBe("1");
    expect(select.options[9].value).toBe("10");
  });

  it("selecting a value from the dropdown calls onChange with the correct integer", () => {
    let received: number | null = null;
    const widget = createScalerWidget({
      baseServings: 4,
      onChange: (v) => (received = v),
    });
    document.body.appendChild(widget);
    const select = widget.querySelector("select") as HTMLSelectElement;
    select.value = "7";
    select.dispatchEvent(new Event("change"));
    expect(received).toBe(7);
    const input = widget.querySelector("input") as HTMLInputElement;
    expect(input.value).toBe("7");
  });
});
