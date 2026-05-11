import type { Quantity, NumberFormat } from "./types";

const NUM = "(\\d+(?:[.,]\\d+)?)";
const PATTERN = new RegExp(`^\\s*${NUM}(?:\\s*-\\s*${NUM})?\\s+(\\S.*?)\\s*$`);

function parseNumber(s: string): { value: number; format: NumberFormat } {
  const hadDecimal = /[.,]/.test(s);
  const decimalSep: "," | "." = s.includes(",") ? "," : ".";
  const normalized = s.replace(",", ".");
  return { value: parseFloat(normalized), format: { decimalSep, hadDecimal } };
}

export function parseQuantity(inner: string): Quantity | null {
  if (!inner) return null;
  const m = PATTERN.exec(inner);
  if (!m) return null;

  const [, firstStr, secondStr, unitRaw] = m;
  const unit = unitRaw.trim();
  if (!unit) return null;

  const first = parseNumber(firstStr);

  if (secondStr !== undefined) {
    const second = parseNumber(secondStr);
    const decimalSep: "," | "." =
      first.format.decimalSep === "," || second.format.decimalSep === ","
        ? ","
        : ".";
    const hadDecimal = first.format.hadDecimal || second.format.hadDecimal;
    return {
      kind: "range",
      from: first.value,
      to: second.value,
      format: { decimalSep, hadDecimal },
      unit,
      raw: inner.trim(),
    };
  }

  return {
    kind: "single",
    value: first.value,
    format: first.format,
    unit,
    raw: inner.trim(),
  };
}
