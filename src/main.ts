import { Plugin } from "obsidian";
import { RecipeScalerSettings, DEFAULT_SETTINGS } from "./settings/types";

export default class RecipeScalerPlugin extends Plugin {
  settings!: RecipeScalerSettings;

  async onload() {
    await this.loadSettings();
  }

  async loadSettings() {
    this.settings = Object.assign(
      {},
      DEFAULT_SETTINGS,
      await this.loadData()
    );
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
