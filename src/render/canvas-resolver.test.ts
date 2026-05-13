import { describe, it, expect } from "vitest";
import { CanvasResolver } from "./canvas-resolver";

interface FakeFile {
  path: string;
  content: string;
}

interface FakeLeaf {
  view: { getViewType(): string; file?: { path: string } };
}

function makeFakeApp(files: FakeFile[], openLeaves: FakeLeaf[]) {
  return {
    workspace: {
      _cb: null as ((..._args: any[]) => void) | null,
      iterateAllLeaves(fn: (leaf: FakeLeaf) => void) {
        openLeaves.forEach(fn);
      },
      on(_event: string, cb: () => void) {
        this._cb = cb;
        return { id: "ref" };
      },
      offref() {},
      trigger() {
        this._cb?.();
      },
    },
    vault: {
      getAbstractFileByPath(p: string) {
        const f = files.find((x) => x.path === p);
        return f ? ({ path: f.path } as any) : null;
      },
      async read(file: { path: string }) {
        const f = files.find((x) => x.path === file.path);
        if (!f) throw new Error("not found");
        return f.content;
      },
    },
  };
}

function canvasNode(...mdPaths: string[]): string {
  return JSON.stringify({
    nodes: mdPaths.map((p, i) => ({
      id: `n${i}`,
      type: "file",
      file: p,
    })),
    edges: [],
  });
}

describe("CanvasResolver", () => {
  it("defaults to note scope when no canvas is open", async () => {
    const app = makeFakeApp([], []);
    const resolver = new CanvasResolver(app as any, () => {});
    await resolver.start();
    expect(resolver.resolveScope("Notes/x.md")).toBe("note:Notes/x.md");
  });

  it("treats .canvas sourcePath as the canvas's own scope", async () => {
    const app = makeFakeApp([], []);
    const resolver = new CanvasResolver(app as any, () => {});
    await resolver.start();
    expect(resolver.resolveScope("a.canvas")).toBe("canvas:a.canvas");
  });

  it("maps embedded md path to canvas scope when canvas is open", async () => {
    const app = makeFakeApp(
      [{ path: "a.canvas", content: canvasNode("Recipes/x.md") }],
      [
        {
          view: { getViewType: () => "canvas", file: { path: "a.canvas" } },
        },
      ]
    );
    const resolver = new CanvasResolver(app as any, () => {});
    await resolver.start();
    expect(resolver.resolveScope("Recipes/x.md")).toBe("canvas:a.canvas");
  });

  it("falls back to note scope when md is not embedded in any open canvas", async () => {
    const app = makeFakeApp(
      [{ path: "a.canvas", content: canvasNode("Recipes/x.md") }],
      [
        {
          view: { getViewType: () => "canvas", file: { path: "a.canvas" } },
        },
      ]
    );
    const resolver = new CanvasResolver(app as any, () => {});
    await resolver.start();
    expect(resolver.resolveScope("Other/y.md")).toBe("note:Other/y.md");
  });

  it("calls onScopeClosed when a canvas leaves the open set", async () => {
    const closed: string[] = [];
    const app = makeFakeApp(
      [{ path: "a.canvas", content: canvasNode("Recipes/x.md") }],
      [
        {
          view: { getViewType: () => "canvas", file: { path: "a.canvas" } },
        },
      ]
    );
    const resolver = new CanvasResolver(app as any, (id) => closed.push(id));
    await resolver.start();
    expect(resolver.resolveScope("Recipes/x.md")).toBe("canvas:a.canvas");

    // Remove leaf and trigger refresh
    (app.workspace as any).iterateAllLeaves = () => {};
    await (resolver as any).refresh();
    expect(closed).toEqual(["canvas:a.canvas"]);
    expect(resolver.resolveScope("Recipes/x.md")).toBe("note:Recipes/x.md");
  });

  it("resolves to canvas scope after mdPathToCanvas is cleared by a second refresh", async () => {
    const app = makeFakeApp(
      [{ path: "a.canvas", content: canvasNode("Recipes/x.md") }],
      [
        {
          view: { getViewType: () => "canvas", file: { path: "a.canvas" } },
        },
      ]
    );
    const resolver = new CanvasResolver(app as any, () => {});
    await resolver.start();
    expect(resolver.resolveScope("Recipes/x.md")).toBe("canvas:a.canvas");

    // Simulate a second refresh (e.g. triggered by canvas node resize)
    // that would re-build mdPathToCanvas from the same open leaves.
    // resolveScope should still return canvas scope via stickyNoteToCanvas.
    await (resolver as any).refresh();
    expect(resolver.resolveScope("Recipes/x.md")).toBe("canvas:a.canvas");
  });

  it("clears sticky cache when canvas is closed", async () => {
    const app = makeFakeApp(
      [{ path: "a.canvas", content: canvasNode("Recipes/x.md") }],
      [
        {
          view: { getViewType: () => "canvas", file: { path: "a.canvas" } },
        },
      ]
    );
    const resolver = new CanvasResolver(app as any, () => {});
    await resolver.start();
    expect(resolver.resolveScope("Recipes/x.md")).toBe("canvas:a.canvas");

    // Close the canvas
    (app.workspace as any).iterateAllLeaves = () => {};
    await (resolver as any).refresh();
    expect(resolver.resolveScope("Recipes/x.md")).toBe("note:Recipes/x.md");
  });

  it("survives malformed canvas JSON", async () => {
    const app = makeFakeApp(
      [{ path: "a.canvas", content: "not-json{{{" }],
      [
        {
          view: { getViewType: () => "canvas", file: { path: "a.canvas" } },
        },
      ]
    );
    const resolver = new CanvasResolver(app as any, () => {});
    await expect(resolver.start()).resolves.toBeUndefined();
  });
});
