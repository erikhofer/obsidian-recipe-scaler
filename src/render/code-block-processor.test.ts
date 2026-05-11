import { describe, it, expect } from "vitest";
import { parseScalerCodeBlock } from "./code-block-processor";

describe("parseScalerCodeBlock", () => {
  it("parses baseServings from a single line", () => {
    expect(parseScalerCodeBlock("baseServings: 4")).toEqual({
      baseServings: 4,
      malformed: false,
    });
  });

  it("is case-insensitive for the key", () => {
    expect(parseScalerCodeBlock("BaseServings: 6")).toEqual({
      baseServings: 6,
      malformed: false,
    });
  });

  it("ignores surrounding whitespace", () => {
    expect(parseScalerCodeBlock("  baseServings :   8  \n")).toEqual({
      baseServings: 8,
      malformed: false,
    });
  });

  it("picks the first valid baseServings line", () => {
    expect(parseScalerCodeBlock("baseServings: 2\nbaseServings: 99")).toEqual({
      baseServings: 2,
      malformed: false,
    });
  });

  it("ignores unknown lines", () => {
    expect(parseScalerCodeBlock("portions: 4\nbaseServings: 3")).toEqual({
      baseServings: 3,
      malformed: false,
    });
  });

  it("returns malformed=true and baseServings=1 for empty input", () => {
    expect(parseScalerCodeBlock("")).toEqual({
      baseServings: 1,
      malformed: true,
    });
  });

  it("returns malformed=true for missing key", () => {
    expect(parseScalerCodeBlock("portions: 4")).toEqual({
      baseServings: 1,
      malformed: true,
    });
  });

  it("returns malformed=true for non-numeric value", () => {
    expect(parseScalerCodeBlock("baseServings: abc")).toEqual({
      baseServings: 1,
      malformed: true,
    });
  });

  it("returns malformed=true for zero or negative", () => {
    expect(parseScalerCodeBlock("baseServings: 0")).toEqual({
      baseServings: 1,
      malformed: true,
    });
  });
});
