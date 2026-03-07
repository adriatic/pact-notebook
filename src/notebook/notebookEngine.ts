import * as fs from "fs";
import * as path from "path";
import { NotebookManager } from "../notebook/notebookManager";

export class NotebookEngine {

  private notebookRoot(): string {

    const nm = new NotebookManager();

    nm.initialize();

    return nm.getCurrentNotebookPath();
  }

  initializeNotebook() {

    const root = this.notebookRoot();

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

    const root = this.notebookRoot();

    const notebookPath = path.join(root, "notebook.pnb");
    const tempPath = notebookPath + ".tmp";

    const notebook = JSON.parse(fs.readFileSync(notebookPath, "utf8"));

    notebook.cells.push(cell);

    const content = JSON.stringify(notebook, null, 2);

    fs.writeFileSync(tempPath, content);

    fs.renameSync(tempPath, notebookPath);
  }
}