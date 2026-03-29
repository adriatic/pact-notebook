import * as vscode from "vscode";
import * as path from "path";

let panel: vscode.WebviewPanel | undefined;

export function activate(context: vscode.ExtensionContext) {

  // 🔥 ALWAYS open PACT immediately and take focus
  panel = createPanel(context);

  vscode.window.onDidChangeActiveTextEditor(async (editor) => {

    if (!editor) return;

    const filePath = editor.document.uri.fsPath;
    const match = filePath.match(/notebook-(\d+)\/prompts\/(prompt-\d+)\.json$/);
    if (!match) return;

    const notebookId = `notebook-${match[1]}`;
    const cellId = match[2];

    let text = "";

    try {
      const content = await vscode.workspace.fs.readFile(editor.document.uri);
      const json = JSON.parse(Buffer.from(content).toString("utf8"));
      text = json.text || "";
    } catch {
      text = "⚠️ Failed to parse prompt";
    }

    vscode.commands.executeCommand("workbench.action.closeActiveEditor");

    if (!panel) {
      panel = createPanel(context);
    }

    panel.reveal(vscode.ViewColumn.One, true); // 🔥 FORCE FOCUS

    panel.webview.postMessage({
      type: "select",
      notebookId,
      cellId,
      text
    });
  });

  const openCmd = vscode.commands.registerCommand("pact.open", () => {
    if (!panel) {
      panel = createPanel(context);
    } else {
      panel.reveal(vscode.ViewColumn.One, true);
    }
  });

  context.subscriptions.push(openCmd);
}

// ======================================================

function createPanel(context: vscode.ExtensionContext): vscode.WebviewPanel {

  const newPanel = vscode.window.createWebviewPanel(
    "pact",
    "PACT",
    vscode.ViewColumn.One, // 🔥 TAKE OVER MAIN AREA
    {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: [
        vscode.Uri.file(path.join(context.extensionPath, "out-ui"))
      ]
    }
  );

  render(newPanel, context);

  newPanel.webview.onDidReceiveMessage(async (msg) => {

    if (msg.type === "navigate") {
      openPromptFile(msg.notebookId, msg.cellId);
    }

    if (msg.type === "run") {
      await handleRun(msg);
    }
  });

  newPanel.onDidDispose(() => {
    panel = undefined;
  });

  return newPanel;
}

// ======================================================

async function openPromptFile(notebookId: string, cellId: string) {

  const workspace = vscode.workspace.workspaceFolders?.[0];
  if (!workspace) return;

  const filePath = path.join(
    workspace.uri.fsPath,
    notebookId,
    "prompts",
    `${cellId}.json`
  );

  await vscode.window.showTextDocument(vscode.Uri.file(filePath));
}

// ======================================================

async function handleRun(msg: any) {

  const workspace = vscode.workspace.workspaceFolders?.[0];
  if (!workspace) return;

  const responseDir = path.join(
    workspace.uri.fsPath,
    msg.notebookId,
    "responses"
  );

  const id = msg.cellId.split("-")[1];

  const responsePath = path.join(
    responseDir,
    `response-${id}.json`
  );

  const content = JSON.stringify({
    response: `Executed ${msg.cellId}`,
    timestamp: new Date().toISOString()
  }, null, 2);

  await vscode.workspace.fs.writeFile(
    vscode.Uri.file(responsePath),
    Buffer.from(content)
  );
}

// ======================================================

function render(panel: vscode.WebviewPanel, context: vscode.ExtensionContext) {

  const scriptUri = panel.webview.asWebviewUri(
    vscode.Uri.file(path.join(context.extensionPath, "out-ui/ui/main.js"))
  );

  panel.webview.html = `
  <!DOCTYPE html>
  <html>
  <body style="margin:0; background:#1e1e1e; color:#ddd; font-family:sans-serif;">

    <div style="display:flex; height:100vh;">

      <div style="flex:4; padding:16px;">
        <div id="center-label" style="text-align:center; font-weight:bold; margin-bottom:10px;"></div>
        <div id="center-body" style="opacity:0.6; text-align:center; margin-top:40px;">
          Select a prompt from Explorer
        </div>
      </div>

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

export function deactivate() {}