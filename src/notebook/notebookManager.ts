import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

export class NotebookManager {

  private getWorkspaceRoot(): string {

    const ws = vscode.workspace.workspaceFolders?.[0];

    if (!ws) {
      throw new Error("No workspace open.");
    }

    return ws.uri.fsPath;
  }

  private registryPath(): string {
    return path.join(this.getWorkspaceRoot(), "notebooks.json");
  }

  private notebooksDir(): string {
    return path.join(this.getWorkspaceRoot(), "notebooks");
  }

  initialize() {

    const notebooksDir = this.notebooksDir();

    if (!fs.existsSync(notebooksDir)) {
      fs.mkdirSync(notebooksDir, { recursive: true });
    }

    const registryPath = this.registryPath();

    if (!fs.existsSync(registryPath)) {

      const registry = {
        current_notebook: "notebook-1",
        notebooks: [
          {
            id: "notebook-1",
            title: "Notebook-1",
            created: new Date().toISOString()
          }
        ]
      };

      fs.writeFileSync(
        registryPath,
        JSON.stringify(registry, null, 2)
      );

      const nbDir = path.join(notebooksDir, "notebook-1");

      fs.mkdirSync(nbDir, { recursive: true });
    }
  }

  private readRegistry(): any {

    return JSON.parse(
      fs.readFileSync(this.registryPath(), "utf8")
    );
  }

  private writeRegistry(registry: any) {

    fs.writeFileSync(
      this.registryPath(),
      JSON.stringify(registry, null, 2)
    );
  }

  private nextNotebookNumber(registry: any): number {

  const nums = registry.notebooks
    .map((n: any) => {

      const match = /^notebook-(\d+)$/.exec(n.id);

      return match ? parseInt(match[1]) : null;

    })
    .filter((n: number | null) => n !== null) as number[];

  if (nums.length === 0) {
    return 1;
  }

  return Math.max(...nums) + 1;
}

  createNotebook(): string {

    const registry = this.readRegistry();

    const num = this.nextNotebookNumber(registry);

    const id = `notebook-${num}`;

    const notebook = {
      id,
      title: `Notebook-${num}`,
      created: new Date().toISOString()
    };

    registry.notebooks.push(notebook);
    registry.current_notebook = id;

    this.writeRegistry(registry);

    const dir = path.join(this.notebooksDir(), id);

    fs.mkdirSync(dir, { recursive: true });

    return id;
  }

  renameNotebook(id: string, newTitle: string) {

    const registry = this.readRegistry();

    const nb = registry.notebooks.find((n: any) => n.id === id);

    if (!nb) {
      throw new Error("Notebook not found.");
    }

    nb.title = newTitle;

    this.writeRegistry(registry);
  }

  getCurrentNotebookId(): string {

    const registry = this.readRegistry();

    return registry.current_notebook;
  }

  getCurrentNotebookPath(): string {

    const id = this.getCurrentNotebookId();

    return path.join(this.notebooksDir(), id);
  }
}