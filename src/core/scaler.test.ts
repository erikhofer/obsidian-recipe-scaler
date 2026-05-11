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
