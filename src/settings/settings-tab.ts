import { App, PluginSettingTab, Setting } from "obsidian";
import type RecipeScalerPlugin from "../main";

export class RecipeScalerSettingTab extends PluginSettingTab {
  plugin: RecipeScalerPlugin;

  constructor(app: App, plugin: RecipeScalerPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "Recipe Scaler" });
    containerEl.createEl("p", {
      text:
        "Singular/plural pairs. When a scaled quantity equals 1, the singular form is used; otherwise the plural form. Mass and volume units (ml, g, kg, l) don't need entries.",
    });

    const list = containerEl.createDiv({ cls: "recipe-scaler-pairs" });
    this.renderPairs(list);

    new Setting(containerEl).addButton((btn) =>
      btn.setButtonText("Add pair").onClick(async () => {
        this.plugin.settings.pluralPairs.push({ singular: "", plural: "" });
        await this.plugin.saveSettings();
        this.display();
      })
    );
  }

  private renderPairs(container: HTMLElement): void {
    const pairs = this.plugin.settings.pluralPairs;
    const seenSingulars = new Set<string>();

    pairs.forEach((pair, index) => {
      const isDup =
        pair.singular !== "" && seenSingulars.has(pair.singular);
      if (pair.singular) seenSingulars.add(pair.singular);

      const row = new Setting(container);
      row.addText((t) =>
        t
          .setPlaceholder("singular (e.g. cup)")
          .setValue(pair.singular)
          .onChange(async (v) => {
            this.plugin.settings.pluralPairs[index].singular = v.trim();
            await this.plugin.saveSettings();
          })
      );
      row.addText((t) =>
        t
          .setPlaceholder("plural (e.g. cups)")
          .setValue(pair.plural)
          .onChange(async (v) => {
            this.plugin.settings.pluralPairs[index].plural = v.trim();
            await this.plugin.saveSettings();
          })
      );
      row.addButton((btn) =>
        btn
          .setIcon("trash")
          .setTooltip("Delete pair")
          .onClick(async () => {
            this.plugin.settings.pluralPairs.splice(index, 1);
            await this.plugin.saveSettings();
            this.display();
          })
      );

      if (isDup) {
        row.settingEl.addClass("recipe-scaler-pair-duplicate");
        row.setDesc("Duplicate singular — first occurrence wins.");
      }
    });
  }
}
