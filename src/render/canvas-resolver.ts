import { App, TFile, EventRef } from "obsidian";
import type { ScopeId } from "../registry/scaler-registry";

export class CanvasResolver {
  private mdPathToCanvas = new Map<string, string>();
  private openCanvases = new Set<string>();
  private app: App;
  private onScopeClosed: (scopeId: ScopeId) => void;
  private layoutRef: EventRef | null = null;

  constructor(app: App, onScopeClosed: (scopeId: ScopeId) => void) {
    this.app = app;
    this.onScopeClosed = onScopeClosed;
  }

  async start(): Promise<void> {
    await this.refresh();
    this.layoutRef = this.app.workspace.on("layout-change", () => {
      void this.refresh();
    });
  }

  stop(): void {
    if (this.layoutRef) {
      this.app.workspace.offref(this.layoutRef);
      this.layoutRef = null;
    }
  }

  resolveScope(sourcePath: string): ScopeId {
    if (sourcePath.endsWith(".canvas")) {
      return `canvas:${sourcePath}`;
    }
    const canvas = this.mdPathToCanvas.get(sourcePath);
    if (canvas) return `canvas:${canvas}`;
    return `note:${sourcePath}`;
  }

  private async refresh(): Promise<void> {
    const newOpen = new Set<string>();
    this.app.workspace.iterateAllLeaves((leaf) => {
      if (leaf.view.getViewType() === "canvas") {
        const file = (leaf.view as any).file;
        if (file?.path) newOpen.add(file.path);
      }
    });

    const newMapping = new Map<string, string>();
    for (const canvasPath of newOpen) {
      const f = this.app.vault.getAbstractFileByPath(canvasPath);
      if (!f || !(f as any).path) continue;
      try {
        const content = await this.app.vault.read(f as TFile);
        const data = JSON.parse(content);
        for (const node of data.nodes ?? []) {
          if (node.type === "file" && typeof node.file === "string") {
            newMapping.set(node.file, canvasPath);
          }
        }
      } catch {
        // malformed canvas file — skip silently
      }
    }

    for (const prev of this.openCanvases) {
      if (!newOpen.has(prev)) {
        this.onScopeClosed(`canvas:${prev}`);
      }
    }

    this.openCanvases = newOpen;
    this.mdPathToCanvas = newMapping;
  }
}
