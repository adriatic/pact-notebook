import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

import { NotebookState } from "./notebook/notebookState";

let cachedHtml: string | null = null;

function getHtml(
  webview: vscode.Webview,
  context: vscode.ExtensionContext,
): string {
  if (cachedHtml !== null) {
    return cachedHtml;
  }

  const htmlPath = path.join(
    context.extensionPath,
    "media",
    "controlPanel.html",
  );

  let html = fs.readFileSync(htmlPath, "utf8");

  const cssUri = webview.asWebviewUri(
    vscode.Uri.joinPath(context.extensionUri, "media", "controlPanel.css"),
  );

  const jsUri = webview.asWebviewUri(
    vscode.Uri.joinPath(context.extensionUri, "media", "controlPanel.js"),
  );

  html = html.replace("{{css}}", cssUri.toString());
  html = html.replace("{{js}}", jsUri.toString());

  cachedHtml = html;

  return html;
}

class ControlPanelProvider implements vscode.WebviewViewProvider {
  private view: vscode.WebviewView | undefined;
  private notebookState: NotebookState;

  constructor(
    private context: vscode.ExtensionContext,
    state: NotebookState,
  ) {
    this.notebookState = state;
  }

  resolveWebviewView(view: vscode.WebviewView): void {
    this.view = view;

    view.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.context.extensionUri, "media"),
      ],
    };

    view.webview.html = getHtml(view.webview, this.context);

    this.pushState();

    view.webview.onDidReceiveMessage((msg) => {
      if (msg.command === "navigateCell") {
        vscode.commands.executeCommand("pact.navigateCell", msg.direction);
      }

      if (msg.command === "runCell") {
        vscode.commands.executeCommand("pact.runCell");
      }

      if (msg.command === "runAll") {
        vscode.commands.executeCommand("pact.runAll");
      }
    });
  }

  pushState(): void {
    if (this.view !== undefined) {
      this.view.webview.postMessage({
        command: "state",
        data: this.notebookState.getState(),
      });
    }
  }
}

export function activate(context: vscode.ExtensionContext): void {
  const notebookState = new NotebookState();

  const controlPanel = new ControlPanelProvider(context, notebookState);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      "pact.controlPanel",
      controlPanel,
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "pact.navigateCell",
      async (direction: number) => {
        const state = notebookState.getState();

        if (!state.notebook) {
          return;
        }

        const target = state.cell + direction;

        if (target < 1 || target > state.totalCells) {
          return;
        }

        const workspace = vscode.workspace.workspaceFolders?.[0];

        if (!workspace) {
          return;
        }

        const promptsPath = path.join(
          workspace.uri.fsPath,
          "notebooks",
          state.notebook,
          "artifacts",
          "prompts",
        );

        if (!fs.existsSync(promptsPath)) {
          return;
        }

        const files = fs
          .readdirSync(promptsPath)
          .filter((f) => f.endsWith(".json"))
          .sort();

        const targetFile = files[target - 1];

        if (!targetFile) {
          return;
        }

        const fileUri = vscode.Uri.file(path.join(promptsPath, targetFile));

        const doc = await vscode.workspace.openTextDocument(fileUri);

        await vscode.window.showTextDocument(doc);
      },
    ),
  );

  vscode.window.onDidChangeActiveTextEditor((editor) => {
    if (editor !== undefined) {
      updateNotebookState(editor, notebookState, controlPanel);
    }
  });

  vscode.workspace.onDidOpenTextDocument(() => {
    const editor = vscode.window.activeTextEditor;

    if (editor !== undefined) {
      updateNotebookState(editor, notebookState, controlPanel);
    }
  });

  const editor = vscode.window.activeTextEditor;

  if (editor !== undefined) {
    updateNotebookState(editor, notebookState, controlPanel);
  }
}

function updateNotebookState(
  editor: vscode.TextEditor,
  notebookState: NotebookState,
  controlPanel: ControlPanelProvider,
): void {
  const filePath = editor.document.uri.fsPath;

  if (filePath.includes("artifacts")) {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];

    if (workspaceFolder !== undefined) {
      const workspace = workspaceFolder.uri.fsPath;

      const parts = filePath.split(path.sep);

      const notebooksIndex = parts.indexOf("notebooks");

      if (notebooksIndex !== -1) {
        const notebookName = parts[notebooksIndex + 1];

        notebookState.setActiveNotebook(notebookName);

        const promptsPath = path.join(
          workspace,
          "notebooks",
          notebookName,
          "artifacts",
          "prompts",
        );

        if (fs.existsSync(promptsPath)) {
          const files = fs
            .readdirSync(promptsPath)
            .filter((f) => f.endsWith(".json"))
            .sort();

          notebookState.setTotalCells(files.length);

          const openedFile = path.basename(filePath);

          const index = files.indexOf(openedFile);

          if (index !== -1) {
            notebookState.setCurrentCell(index + 1);
          }

          controlPanel.pushState();
        }
      }
    }
  }
}

export function deactivate(): void {}
