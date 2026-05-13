import { Plugin } from "obsidian";
import { RecipeScalerSettings, DEFAULT_SETTINGS } from "./settings/types";
import { RecipeScalerSettingTab } from "./settings/settings-tab";
import { ScalerRegistry } from "./registry/scaler-registry";
import { createPostProcessor } from "./render/post-processor";
import { createCodeBlockProcessor } from "./render/code-block-processor";

export default class RecipeScalerPlugin extends Plugin {
  settings!: RecipeScalerSettings;
  registry!: ScalerRegistry;

  async onload() {
    await this.loadSettings();
    this.registry = new ScalerRegistry(() => this.settings.pluralPairs);

    this.registerMarkdownCodeBlockProcessor(
      "recipe-scaler",
      createCodeBlockProcessor({ registry: this.registry })
    );

    this.registerMarkdownPostProcessor(
      createPostProcessor({ registry: this.registry })
    );

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
