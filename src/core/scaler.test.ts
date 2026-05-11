import { describe, it, expect } from "vitest";
import { parseQuantity } from "./scaler";

describe("parseQuantity", () => {
  it("parses integer with unit", () => {
    expect(parseQuantity("100 ml")).toEqual({
      kind: "single",
      value: 100,
      format: { decimalSep: ".", hadDecimal: false },
      unit: "ml",
      raw: "100 ml",
    });
  });

  it("parses decimal with comma separator", () => {
    expect(parseQuantity("0,5 tsp")).toEqual({
      kind: "single",
      value: 0.5,
      format: { decimalSep: ",", hadDecimal: true },
      unit: "tsp",
      raw: "0,5 tsp",
    });
  });

  it("parses decimal with dot separator", () => {
    expect(parseQuantity("1.5 kg")).toEqual({
      kind: "single",
      value: 1.5,
      format: { decimalSep: ".", hadDecimal: true },
      unit: "kg",
      raw: "1.5 kg",
    });
  });

  it("parses range with integers", () => {
    expect(parseQuantity("100-200 ml")).toEqual({
      kind: "range",
      from: 100,
      to: 200,
      format: { decimalSep: ".", hadDecimal: false },
      unit: "ml",
      raw: "100-200 ml",
    });
  });

  it("parses range with decimal endpoints", () => {
    expect(parseQuantity("0,5-1 tsp")).toEqual({
      kind: "range",
      from: 0.5,
      to: 1,
      format: { decimalSep: ",", hadDecimal: true },
      unit: "tsp",
      raw: "0,5-1 tsp",
    });
  });

  it("captures multi-word unit as whole remainder", () => {
    const q = parseQuantity("2 large cloves");
    expect(q).toMatchObject({ kind: "single", value: 2, unit: "large cloves" });
  });

  it("trims whitespace around unit", () => {
    const q = parseQuantity("2   cups  ");
    expect(q).toMatchObject({ kind: "single", value: 2, unit: "cups" });
  });

  it("returns null for empty input", () => {
    expect(parseQuantity("")).toBeNull();
  });

  it("returns null when no unit follows", () => {
    expect(parseQuantity("100")).toBeNull();
    expect(parseQuantity("100  ")).toBeNull();
  });

  it("returns null for non-numeric input", () => {
    expect(parseQuantity("see above")).toBeNull();
  });

  it("returns null for malformed range", () => {
    expect(parseQuantity("100- ml")).toBeNull();
    expect(parseQuantity("-200 ml")).toBeNull();
  });
});

import { scaleNumber } from "./scaler";

describe("scaleNumber", () => {
  const dotInt = { decimalSep: "." as const, hadDecimal: false };
  const dotDec = { decimalSep: "." as const, hadDecimal: true };
  const comDec = { decimalSep: "," as const, hadDecimal: true };

  it("integer scaling that stays integer", () => {
    expect(scaleNumber(100, 1.5, dotInt)).toBe("150");
    expect(scaleNumber(2, 3, dotInt)).toBe("6");
  });

  it("integer scaling that becomes a decimal uses dot by default", () => {
    expect(scaleNumber(1, 0.5, dotInt)).toBe("0.5");
    expect(scaleNumber(100, 0.333, dotInt)).toBe("33.3");
  });

  it("smart-rounds near-integer results to integer", () => {
    expect(scaleNumber(0.33, 3, dotDec)).toBe("1");
    expect(scaleNumber(100, 1 / 3, dotInt)).toBe("33.33");
  });

  it("strips trailing zeros at 2 decimals", () => {
    expect(scaleNumber(100, 0.25, dotInt)).toBe("25");
    expect(scaleNumber(100, 0.125, dotInt)).toBe("12.5");
  });

  it("preserves comma separator for decimal output", () => {
    expect(scaleNumber(1.5, 1, comDec)).toBe("1,5");
    expect(scaleNumber(0.5, 1, comDec)).toBe("0,5");
    expect(scaleNumber(0.5, 2, comDec)).toBe("1");
  });

  it("preserves dot separator for decimal output", () => {
    expect(scaleNumber(1.5, 2, dotDec)).toBe("3");
    expect(scaleNumber(0.7, 0.5, dotDec)).toBe("0.35");
  });

  it("clamps very small non-zero results to two decimals", () => {
    expect(scaleNumber(100, 0.001, dotInt)).toBe("0.1");
  });

  it("handles zero factor", () => {
    expect(scaleNumber(100, 0, dotInt)).toBe("0");
  });
});

import { applyPluralization } from "./scaler";

describe("applyPluralization", () => {
  const pairs = [
    { singular: "cup", plural: "cups" },
    { singular: "clove", plural: "cloves" },
  ];

  it("returns singular when value is exactly 1", () => {
    expect(applyPluralization(1, "cup", pairs)).toBe("cup");
    expect(applyPluralization(1, "cups", pairs)).toBe("cup");
  });

  it("returns plural when value is not 1", () => {
    expect(applyPluralization(2, "cup", pairs)).toBe("cups");
    expect(applyPluralization(0.5, "cup", pairs)).toBe("cups");
    expect(applyPluralization(0, "cup", pairs)).toBe("cups");
  });

  it("leaves unit unchanged when not in pair list", () => {
    expect(applyPluralization(2, "ml", pairs)).toBe("ml");
    expect(applyPluralization(1, "ml", pairs)).toBe("ml");
  });

  it("matches case-sensitively", () => {
    expect(applyPluralization(2, "Cup", pairs)).toBe("Cup");
  });

  it("matches when unit is already in the plural form", () => {
    expect(applyPluralization(2, "cloves", pairs)).toBe("cloves");
    expect(applyPluralization(1, "cloves", pairs)).toBe("clove");
  });

  it("returns the input for empty unit", () => {
    expect(applyPluralization(1, "", pairs)).toBe("");
  });

  it("returns the input when pairs list is empty", () => {
    expect(applyPluralization(2, "cup", [])).toBe("cup");
  });
});

import { renderScaled } from "./scaler";

describe("renderScaled", () => {
  const pairs = [
    { singular: "cup", plural: "cups" },
    { singular: "clove", plural: "cloves" },
  ];

  it("scales a single integer quantity", () => {
    const q = parseQuantity("100 ml")!;
    expect(renderScaled(q, 1.5, pairs)).toBe("150 ml");
  });

  it("switches plural to singular on scale down", () => {
    const q = parseQuantity("2 cups")!;
    expect(renderScaled(q, 0.5, pairs)).toBe("1 cup");
  });

  it("switches singular to plural on scale up", () => {
    const q = parseQuantity("1 cup")!;
    expect(renderScaled(q, 2, pairs)).toBe("2 cups");
  });

  it("scales a range and pluralizes by upper endpoint", () => {
    const q = parseQuantity("1-2 cloves")!;
    expect(renderScaled(q, 0.5, pairs)).toBe("0.5-1 clove");
    expect(renderScaled(q, 2, pairs)).toBe("2-4 cloves");
  });

  it("preserves comma separator in scaled decimal output", () => {
    const q = parseQuantity("0,5 tsp")!;
    expect(renderScaled(q, 3, pairs)).toBe("1,5 tsp");
  });

  it("leaves unknown unit untouched", () => {
    const q = parseQuantity("100 ml")!;
    expect(renderScaled(q, 0.5, pairs)).toBe("50 ml");
  });
});
