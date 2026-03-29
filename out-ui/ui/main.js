"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
const path = require("path");
let panel;
function activate(context) {
    const openCmd = vscode.commands.registerCommand("pact.open", () => {
        if (panel) {
            panel.reveal(vscode.ViewColumn.Two);
            return;
        }
        panel = vscode.window.createWebviewPanel("pact", "", vscode.ViewColumn.Two, {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [
                vscode.Uri.file(path.join(context.extensionPath, "out-ui")),
            ],
        });
        render(panel, context);
        panel.webview.onDidReceiveMessage(async (msg) => {
            if (msg.type === "navigate") {
                openPromptFile(msg.notebookId, msg.cellId);
            }
            if (msg.type === "run") {
                await handleRun(msg);
            }
        });
        panel.onDidDispose(() => (panel = undefined));
    });
    context.subscriptions.push(openCmd);
    // 🔥 Explorer → Extension → Webview (NOW WITH CONTENT)
    vscode.window.onDidChangeActiveTextEditor(async (editor) => {
        if (!editor || !panel)
            return;
        const filePath = editor.document.uri.fsPath;
        const match = filePath.match(/notebook-(\d+)\/prompts\/(prompt-\d+)\.json$/);
        if (!match)
            return;
        const notebookId = `notebook-${match[1]}`;
        const cellId = match[2];
        // 🔥 READ FILE HERE (correct place)
        let text = "";
        let raw = "";
        try {
            const content = await vscode.workspace.fs.readFile(editor.document.uri);
            raw = Buffer.from(content).toString("utf8");
            const json = JSON.parse(raw);
            text = json.text || "";
        }
        catch {
            text = "⚠️ Failed to parse prompt";
        }
        // 🔥 SEND FULL DATA TO WEBVIEW
        panel.webview.postMessage({
            type: "select",
            notebookId,
            cellId,
            text,
        });
        // close editor (keep clean UI)
        vscode.commands.executeCommand("workbench.action.closeActiveEditor");
    });
}
// ---------- NAV ----------
async function openPromptFile(notebookId, cellId) {
    const workspace = vscode.workspace.workspaceFolders?.[0];
    if (!workspace)
        return;
    const filePath = path.join(workspace.uri.fsPath, notebookId, "prompts", `${cellId}.json`);
    const uri = vscode.Uri.file(filePath);
    await vscode.window.showTextDocument(uri, {
        preview: false,
        viewColumn: vscode.ViewColumn.One,
    });
}
// ---------- RUN ----------
async function handleRun(msg) {
    const workspace = vscode.workspace.workspaceFolders?.[0];
    if (!workspace)
        return;
    const responseDir = path.join(workspace.uri.fsPath, msg.notebookId, "responses");
    const id = msg.cellId.split("-")[1];
    const responsePath = path.join(responseDir, `response-${id}.json`);
    const content = JSON.stringify({
        response: `Executed ${msg.cellId}`,
        timestamp: new Date().toISOString(),
    }, null, 2);
    await vscode.workspace.fs.writeFile(vscode.Uri.file(responsePath), Buffer.from(content));
}
// ---------- RENDER ----------
function render(panel, context) {
    const scriptUri = panel.webview.asWebviewUri(vscode.Uri.file(path.join(context.extensionPath, "out-ui/ui/main.js")));
    panel.webview.html = `
  <!DOCTYPE html>
  <html>
  <body style="margin:0; background:#1e1e1e; color:#ddd; font-family:sans-serif;">

    <div style="display:flex; height:100vh;">

      <!-- CENTER -->
      <div style="flex:4; padding:16px;">
        <div id="center-label" style="text-align:center; font-weight:bold; margin-bottom:10px;"></div>
        <div id="center-body"></div>
      </div>

      <!-- RIGHT -->
      <div style="flex:1; border-left:1px solid #444; padding:10px;">
        <div style="text-align:center; font-weight:bold; margin-bottom:10px;">
          Execution
        </div>
        <div id="exec"></div>
      </div>

    </div>

    <script src="${scriptUri}"></script>
  </body>
  </html>`;
}
function deactivate() { }
