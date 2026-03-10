import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { ExecutionEngine } from "../execution/executionEngine";

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function readJson(filePath: string): any {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function tryReadJson(filePath: string): any | null {
  try {
    return readJson(filePath);
  } catch {
    return null;
  }
}

function getWorkspaceRoot(): string {
  const ws = vscode.workspace.workspaceFolders?.[0];
  if (!ws) {
    throw new Error("No workspace open.");
  }
  return ws.uri.fsPath;
}

function renderHtml(): string {
  const root = getWorkspaceRoot();

  const notebookPath = path.join(root, "notebook.pnb");
  const notebook = tryReadJson(notebookPath) ?? { cells: [] };

  const draftsDir = path.join(root, "artifacts/drafts");
  const proposalsDir = path.join(root, "artifacts/proposals");

  const draftFiles = fs.existsSync(draftsDir)
    ? fs.readdirSync(draftsDir).filter((f) => f.endsWith(".json"))
    : [];

  const proposalFiles = fs.existsSync(proposalsDir)
    ? fs.readdirSync(proposalsDir).filter((f) => f.endsWith(".json"))
    : [];

  const proposals = proposalFiles
    .map((f) => ({
      file: f,
      data: tryReadJson(path.join(proposalsDir, f)),
    }))
    .filter((x) => x.data && x.data.originating_cell);

  const proposalsByCell = new Map<string, { file: string; data: any }[]>();

  for (const p of proposals) {
    const key = p.data.originating_cell;
    const arr = proposalsByCell.get(key) ?? [];
    arr.push(p);
    proposalsByCell.set(key, arr);
  }

  let body = `<h1>PACT Notebook</h1>`;

  body += `<p style="opacity:.7">
  Notebook rendered from artifacts. Cells are immutable.
  Moderator approvals create new cells.
  </p>`;

  if (draftFiles.length) {
    body += `<h2>Draft Prompts</h2>`;

    for (const f of draftFiles) {
      const draft = tryReadJson(path.join(draftsDir, f));

      body += `
      <section class="cell">
        <div class="cellHeader">
          <div class="cellTitle">Draft</div>
        </div>
        <pre class="scrollbox">${escapeHtml(draft?.text ?? "")}</pre>
      </section>
      `;
    }
  }

  for (const cell of notebook.cells ?? []) {
    const prompt = tryReadJson(path.join(root, cell.prompt_ref));
    const response = tryReadJson(path.join(root, cell.response_ref));

    const moderation = cell.moderation_ref
      ? tryReadJson(path.join(root, cell.moderation_ref))
      : null;

    const instr = cell.instrumentation_ref
      ? tryReadJson(path.join(root, cell.instrumentation_ref))
      : null;

    const shortId = (cell.cell_id as string).slice(0, 8);

    body += `
    <section class="cell">

      <div class="cellHeader">
        <div class="cellTitle">Cell ${escapeHtml(shortId)}</div>
        <div class="cellMeta">${escapeHtml(cell.state ?? "")}</div>
      </div>

      <details>
        <summary>Prompt</summary>
        <pre class="scrollbox">${escapeHtml(prompt?.text ?? "")}</pre>
      </details>

      <details open>
        <summary>Response</summary>
        <pre class="scrollbox">${escapeHtml(
          response?.content ?? response?.text ?? "",
        )}</pre>
      </details>
    `;

    if (moderation) {
      body += `
      <details>
        <summary>Moderation</summary>
        <pre class="scrollbox">${escapeHtml(
          JSON.stringify(moderation, null, 2),
        )}</pre>
      </details>
      `;
    }

    if (instr) {
      body += `
      <details>
        <summary>Instrumentation</summary>
        <pre class="scrollbox">${escapeHtml(
          JSON.stringify(instr, null, 2),
        )}</pre>
      </details>
      `;
    }

    const cellProposals = proposalsByCell.get(cell.cell_id) ?? [];

    if (cellProposals.length) {
      body += `<div class="props"><div class="propsTitle">Proposals</div>`;

      for (const p of cellProposals) {
        const status = p.data.status ?? "PENDING";
        const disabled = status === "APPROVED" ? "disabled" : "";

        body += `
        <div class="propRow">
          <div class="propText">${escapeHtml(p.data.proposal ?? "")}</div>
          <div class="propRight">
            <span class="badge">${escapeHtml(status)}</span>
            <button ${disabled} data-propfile="${escapeHtml(
              p.file,
            )}">Approve</button>
          </div>
        </div>
        `;
      }

      body += `</div>`;
    }

    body += `</section>`;
  }

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">

<style>

body {
  font-family: -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif;
  padding: 16px;
}

pre {
  background: rgba(127,127,127,.12);
  padding: 10px;
  border-radius: 10px;
}

.scrollbox {
  max-height: 350px;
  overflow-y: auto;
}

.cell {
  border: 1px solid rgba(127,127,127,.25);
  border-radius: 14px;
  padding: 12px;
  margin: 12px 0;
}

.cellHeader {
  display:flex;
  justify-content:space-between;
}

.cellTitle {
  font-weight:700;
}

.cellMeta {
  opacity:.7;
}

.props {
  margin-top:10px;
}

.propRow {
  display:flex;
  justify-content:space-between;
  padding:6px 0;
}

.propText {
  flex:1;
}

.badge {
  background:rgba(127,127,127,.2);
  padding:2px 8px;
  border-radius:10px;
}

button {
  margin-left:8px;
}

</style>

</head>

<body>

${body}

<script>

const vscode = acquireVsCodeApi();

document.querySelectorAll("button[data-propfile]").forEach(btn => {

  btn.addEventListener("click", () => {

    const file = btn.getAttribute("data-propfile");

    vscode.postMessage({
      type: "approveProposalFile",
      file
    });

  });

});

</script>

</body>
</html>
`;
}

export function openNotebookWebview(context: vscode.ExtensionContext) {
  const panel = vscode.window.createWebviewPanel(
    "pactNotebook",
    "PACT Notebook",
    vscode.ViewColumn.One,
    { enableScripts: true },
  );

  const refresh = () => {
    try {
      panel.webview.html = renderHtml();
    } catch (e: any) {
      panel.webview.html = `<pre>${escapeHtml(String(e))}</pre>`;
    }
  };

  refresh();

  panel.webview.onDidReceiveMessage(async (msg) => {
    if (msg?.type === "approveProposalFile") {
      refresh();
    }
  });

  const watcher = vscode.workspace.createFileSystemWatcher("**/notebook.pnb");

  watcher.onDidChange(refresh);
  watcher.onDidCreate(refresh);
  watcher.onDidDelete(refresh);

  context.subscriptions.push(watcher);
}
