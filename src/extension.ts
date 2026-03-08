import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

import { NotebookState } from "./notebook/notebookState";

function getHtml(
  webview: vscode.Webview,
  context: vscode.ExtensionContext,
): string {
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

  return html;
}

class ControlPanelProvider implements vscode.WebviewViewProvider {
  private notebookState = new NotebookState();

  constructor(private readonly context: vscode.ExtensionContext) {}

  resolveWebviewView(view: vscode.WebviewView): void {
    view.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.context.extensionUri, "media"),
      ],
    };

    view.webview.html = getHtml(view.webview, this.context);

    this.notebookState.setActiveNotebook("notebook-2");

    view.webview.postMessage({
      command: "state",
      data: this.notebookState.getState(),
    });

    view.webview.onDidReceiveMessage(async (msg) => {
      switch (msg.command) {
        case "runCell":
          vscode.window.showInformationMessage(
            "Run " +
              this.notebookState.getActiveNotebook() +
              " cell " +
              this.notebookState.getCurrentCell(),
          );

          view.webview.postMessage({
            command: "setReady",
          });

          break;

        case "runAll":
          vscode.window.showInformationMessage("Run All Cells");

          view.webview.postMessage({
            command: "setReady",
          });

          break;

        case "clearOutput":
          vscode.window.showInformationMessage("Clear Output");

          view.webview.postMessage({
            command: "setReady",
          });

          break;

        case "showLedger":
          vscode.window.showInformationMessage("Show Ledger");

          view.webview.postMessage({
            command: "setReady",
          });

          break;

        case "navigateCell":
          const current = this.notebookState.getCurrentCell();
          const total = this.notebookState.getTotalCells();

          let next = current + msg.direction;

          if (next < 1) next = 1;
          if (next > total) next = total;

          this.notebookState.setCurrentCell(next);

          view.webview.postMessage({
            command: "state",
            data: this.notebookState.getState(),
          });

          break;
      }
    });
  }
}

export function activate(context: vscode.ExtensionContext): void {
  const provider = new ControlPanelProvider(context);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider("pact.controlPanel", provider),
  );
}

export function deactivate(): void {}
