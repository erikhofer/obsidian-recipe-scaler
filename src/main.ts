import { Plugin } from "obsidian";
import { RecipeScalerSettings, DEFAULT_SETTINGS } from "./settings/types";
import { RecipeScalerSettingTab } from "./settings/settings-tab";
import { ScalerRegistry } from "./registry/scaler-registry";
import { createPostProcessor } from "./render/post-processor";
import { createCodeBlockProcessor } from "./render/code-block-processor";
import { CanvasResolver } from "./render/canvas-resolver";

export default class RecipeScalerPlugin extends Plugin {
  settings!: RecipeScalerSettings;
  registry!: ScalerRegistry;
  canvasResolver!: CanvasResolver;

  async onload() {
    await this.loadSettings();
    this.registry = new ScalerRegistry(() => this.settings.pluralPairs);
    this.canvasResolver = new CanvasResolver(this.app, (scopeId) =>
      this.registry.cleanupScope(scopeId)
    );

    this.app.workspace.onLayoutReady(() => {
      void this.canvasResolver.start();
    });

    const resolveScope = (sourcePath: string) =>
      this.canvasResolver.resolveScope(sourcePath);

    this.registerMarkdownCodeBlockProcessor(
      "recipe-scaler",
      createCodeBlockProcessor({ registry: this.registry, resolveScope })
    );

    this.registerMarkdownPostProcessor(
      createPostProcessor({ registry: this.registry, resolveScope })
    );

    this.addSettingTab(new RecipeScalerSettingTab(this.app, this));
  }

  onunload() {
    this.canvasResolver?.stop();
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
