import { Plugin } from "obsidian";
import { RecipeScalerSettings, DEFAULT_SETTINGS } from "./settings/types";
import { RecipeScalerSettingTab } from "./settings/settings-tab";

export default class RecipeScalerPlugin extends Plugin {
  settings!: RecipeScalerSettings;

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new RecipeScalerSettingTab(this.app, this));
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
