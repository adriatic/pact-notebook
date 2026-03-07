import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

import { ExecutionEngine } from "./execution/executionEngine";
import { ArtifactStore } from "./artifacts/artifactStore";
import { NotebookOverlay } from "./overlays/notebookOverlay";
import { openNotebookWebview } from "./overlays/notebookWebview";
import { NotebookManager } from "./notebook/notebookManager";

export function activate(context: vscode.ExtensionContext) {

  /*
  PACT: Create Prompt
  */

  const createPrompt = vscode.commands.registerCommand(
    "pact.createPrompt",
    async () => {

      const doc = await vscode.workspace.openTextDocument({
        content: "",
        language: "markdown"
      });

      vscode.window.showTextDocument(doc);

    }
  );

  context.subscriptions.push(createPrompt);

  /*
  PACT: Execute Prompt
  */

  const executePrompt = vscode.commands.registerCommand(
    "pact.executePrompt",
    async () => {

      const editor = vscode.window.activeTextEditor;

      if (!editor) {
        vscode.window.showErrorMessage("No prompt editor open.");
        return;
      }

      const prompt = editor.document.getText();

      if (!prompt.trim()) {
        vscode.window.showErrorMessage("Prompt is empty.");
        return;
      }

      const engine = new ExecutionEngine();

      await engine.executePrompt(prompt);

      vscode.window.showInformationMessage("PACT: Prompt executed");

      openNotebookWebview(context);

    }
  );

  context.subscriptions.push(executePrompt);

  /*
  PACT: Save Draft
  */

  const saveDraft = vscode.commands.registerCommand(
    "pact.saveDraft",
    async () => {

      const editor = vscode.window.activeTextEditor;

      if (!editor) {
        vscode.window.showErrorMessage("No prompt editor open.");
        return;
      }

      const prompt = editor.document.getText();

      if (!prompt.trim()) {
        vscode.window.showErrorMessage("Prompt is empty.");
        return;
      }

      const store = new ArtifactStore();

      store.initialize();

      store.createDraftArtifact(prompt);

      vscode.window.showInformationMessage("Draft saved.");

    }
  );

  context.subscriptions.push(saveDraft);

  /*
  PACT: Load Draft
  */

  const loadDraft = vscode.commands.registerCommand(
    "pact.loadDraft",
    async () => {

      const ws = vscode.workspace.workspaceFolders?.[0];

      if (!ws) {
        vscode.window.showErrorMessage("No workspace open.");
        return;
      }

      const draftsDir = path.join(ws.uri.fsPath, "artifacts", "drafts");

      if (!fs.existsSync(draftsDir)) {
        vscode.window.showInformationMessage("No drafts directory found.");
        return;
      }

      const files = fs
        .readdirSync(draftsDir)
        .filter((f) => f.endsWith(".json"));

      if (files.length === 0) {
        vscode.window.showInformationMessage("No drafts available.");
        return;
      }

      const pick = await vscode.window.showQuickPick(files, {
        placeHolder: "Select draft"
      });

      if (!pick) {
        return;
      }
      const draftPath = path.join(draftsDir, pick);

      const draft = JSON.parse(
        fs.readFileSync(draftPath, "utf8")
      );

      const doc = await vscode.workspace.openTextDocument({
        content: draft.text,
        language: "markdown"
      });

      vscode.window.showTextDocument(doc);

    }
  );

  context.subscriptions.push(loadDraft);

  /*
  PACT: New Notebook
  */

  const newNotebook = vscode.commands.registerCommand(
    "pact.newNotebook",
    async () => {

      const nm = new NotebookManager();

      nm.initialize();

      const id = nm.createNotebook();

      vscode.window.showInformationMessage(
        "Created notebook: " + id
      );

    }
  );

  context.subscriptions.push(newNotebook);

  /*
  PACT: Show Notebook
  */

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

    }
  );

  context.subscriptions.push(showNotebook);

  /*
  PACT: Open Notebook
  */

  const openNotebook = vscode.commands.registerCommand(
    "pact.openNotebook",
    async () => {

      openNotebookWebview(context);

    }
  );

  context.subscriptions.push(openNotebook);

}

export function deactivate() {}