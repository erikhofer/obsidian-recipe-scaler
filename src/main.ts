import { Plugin } from "obsidian";
import { RecipeScalerSettings, DEFAULT_SETTINGS } from "./settings/types";
import { RecipeScalerSettingTab } from "./settings/settings-tab";
import { ScalerRegistry } from "./registry/scaler-registry";
import { createPostProcessor } from "./render/post-processor";

export default class RecipeScalerPlugin extends Plugin {
  settings!: RecipeScalerSettings;
  registry!: ScalerRegistry;

  async onload() {
    await this.loadSettings();
    this.registry = new ScalerRegistry(() => this.settings.pluralPairs);

    this.registerMarkdownPostProcessor(
      createPostProcessor({
        registry: this.registry,
        // Note-only scope for now; canvas resolver added in Task 14.
        resolveScope: (sourcePath: string) => `note:${sourcePath}`,
      })
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
