export type NumberFormat = {
  decimalSep: "," | ".";
  hadDecimal: boolean;
};

export type Quantity =
  | {
      kind: "single";
      value: number;
      format: NumberFormat;
      unit: string;
      raw: string;
    }
  | {
      kind: "range";
      from: number;
      to: number;
      format: NumberFormat;
      unit: string;
      raw: string;
    };

export type PluralPair = {
  singular: string;
  plural: string;
};
