import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

export class NotebookOverlay {
  render(): string {
    const workspace = vscode.workspace.workspaceFolders?.[0];

    if (!workspace) {
      return "No workspace open.";
    }

    const root = workspace.uri.fsPath;

    const notebookPath = path.join(root, "notebook.pnb");

    const notebook = JSON.parse(fs.readFileSync(notebookPath, "utf8"));

    let output = "";

    for (const cell of notebook.cells) {
      const promptPath = path.join(root, cell.prompt_ref);
      const responsePath = path.join(root, cell.response_ref);

      const prompt = JSON.parse(fs.readFileSync(promptPath, "utf8"));
      const response = JSON.parse(fs.readFileSync(responsePath, "utf8"));

      output += `\n=== Cell ${cell.cell_id.slice(0, 8)} ===\n`;

      output += `\nPrompt:\n${prompt.text}\n`;

      output += `\nResponse:\n${response.content}\n`;

      if (cell.moderation_ref) {
        output += "\nModerated\n";
      }

      output += "\n--------------------------\n";
    }

    return output;
  }
}
