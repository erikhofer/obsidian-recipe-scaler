import type { PluralPair } from "../core/types";

export interface RecipeScalerSettings {
  pluralPairs: PluralPair[];
}

export const DEFAULT_SETTINGS: RecipeScalerSettings = {
  pluralPairs: [],
};
