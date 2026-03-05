import * as vscode from "vscode";
import { ExecutionEngine } from "./execution/executionEngine";
import { NotebookOverlay } from "./overlays/notebookOverlay";

export function activate(context: vscode.ExtensionContext) {
  const executePrompt = vscode.commands.registerCommand(
    "pact.executePrompt",
    async () => {
      const prompt = await vscode.window.showInputBox({
        placeHolder: "Enter prompt",
      });

      if (!prompt) {
        return;
      }

      const executionEngine = new ExecutionEngine();

      const response = await executionEngine.executePrompt(prompt);

      vscode.window.showInformationMessage(response);
    },
  );

  context.subscriptions.push(executePrompt);

  const approveProposal = vscode.commands.registerCommand(
    "pact.approveProposal",
    async () => {
      const engine = new ExecutionEngine();

      await engine.approveProposal();
    },
  );

  context.subscriptions.push(approveProposal);

  const showNotebook = vscode.commands.registerCommand(
    "pact.showNotebook",
    async () => {
      const overlay = new NotebookOverlay();

      const view = overlay.render();

      const doc = await vscode.workspace.openTextDocument({
        content: view,
        language: "markdown",
      });

      vscode.window.showTextDocument(doc);
    },
  );

  context.subscriptions.push(showNotebook);
}

export function deactivate() {}
