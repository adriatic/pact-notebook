import * as path from "path";
import * as fs from "fs";

/**
 * PactPaths automatically resolves correct root,
 * even if VSCode is opened inside /notebooks
 */
export class PactPaths {
  private resolvedRoot: string;

  constructor(private workspaceRoot: string) {
    this.resolvedRoot = this.resolveRoot(workspaceRoot);
    console.log("Resolved PACT root:", this.resolvedRoot);
  }

  private resolveRoot(root: string): string {
    // Case 1: opened at project root
    if (fs.existsSync(path.join(root, "notebooks"))) {
      return root;
    }

    // Case 2: opened inside /notebooks
    const parent = path.dirname(root);
    if (path.basename(root) === "notebooks") {
      return parent;
    }

    // fallback
    return root;
  }

  // ---- ROOT ----

  notebooksRoot() {
    return path.join(this.resolvedRoot, "notebooks");
  }

  notebook(name: string) {
    return path.join(this.notebooksRoot(), name);
  }

  prompts(name: string) {
    return path.join(this.notebook(name), "prompts");
  }

  responses(name: string) {
    return path.join(this.notebook(name), "artifacts", "responses");
  }

  notebookFile(name: string) {
    return path.join(this.notebook(name), "notebook.pnb");
  }
}