import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

export class NotebookEngine {
  private workspaceRoot(): string {
    const folder = vscode.workspace.workspaceFolders?.[0];

    if (!folder) {
      throw new Error("No workspace open");
    }

    return folder.uri.fsPath;
  }

  initializeNotebook() {
    const root = this.workspaceRoot();

    const notebookPath = path.join(root, "notebook.pnb");

    if (fs.existsSync(notebookPath)) {
      return;
    }

    const notebook = {
      pact_notebook_version: 1,

      metadata: {
        created: new Date().toISOString(),
      },

      cells: [],
    };

    fs.writeFileSync(notebookPath, JSON.stringify(notebook, null, 2));
  }

  appendCell(cell: any) {
    const root = this.workspaceRoot();

    const notebookPath = path.join(root, "notebook.pnb");
    const tempPath = notebookPath + ".tmp";
    const notebook = JSON.parse(fs.readFileSync(notebookPath, "utf8"));

    notebook.cells.push(cell);

    const content = JSON.stringify(notebook, null, 2);
    fs.writeFileSync(tempPath, content);
    fs.renameSync(tempPath, notebookPath);
  }
}
