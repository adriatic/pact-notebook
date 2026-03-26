import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

import { PactPaths } from "./schema/pactPaths";

// ---------- STATE ----------

const STATE = {
  notebook: "",
  index: 0
};

let TREE: vscode.TreeView<Item>;

// ---------- CONTENT PROVIDER ----------

class PactContentProvider implements vscode.TextDocumentContentProvider {
  private _onDidChange = new vscode.EventEmitter<vscode.Uri>();
  onDidChange = this._onDidChange.event;

  private content = "";

  setContent(text: string, uri: vscode.Uri) {
    this.content = text;
    this._onDidChange.fire(uri);
  }

  provideTextDocumentContent(): string {
    return this.content;
  }
}

const provider = new PactContentProvider();

// ---------- ACTIVATE ----------

export function activate(context: vscode.ExtensionContext) {
  const root = vscode.workspace.workspaceFolders?.[0].uri.fsPath!;
  const paths = new PactPaths(root);

  vscode.workspace.registerTextDocumentContentProvider("pact", provider);

  const explorer = new PactExplorerProvider(paths);

  TREE = vscode.window.createTreeView("pactExplorer", {
    treeDataProvider: explorer
  });

  const control = new PactControlProvider(paths, explorer);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider("pact.controlPanel", control)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("pact.openPrompt", async (file: string) => {
      const notebook = getNotebook(file);
      const list = getPromptList(paths, notebook);

      STATE.notebook = notebook;
      STATE.index = list.indexOf(file);

      await openPrompt(file);

      explorer.reveal(file);
      control.render();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("pact.selectNotebook", async (name: string) => {
      STATE.notebook = name;
      STATE.index = 0;

      const list = getPromptList(paths, name);

      if (list.length > 0) {
        await openPrompt(list[0]);
        explorer.reveal(list[0]);
      }

      control.render();
    })
  );
}

// ---------- CONTROL ----------

class PactControlProvider implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView;

  constructor(
    private paths: PactPaths,
    private explorer: PactExplorerProvider
  ) {}

  resolveWebviewView(view: vscode.WebviewView) {
    this.view = view;

    view.webview.options = { enableScripts: true };

    view.webview.onDidReceiveMessage(msg => {
      if (msg.cmd === "prev") this.move(-1);
      if (msg.cmd === "next") this.move(1);
      if (msg.cmd === "run") this.run();
    });

    this.render();
  }

  render() {
    if (!this.view) return;

    const list = getPromptList(this.paths, STATE.notebook);

    const atStart = STATE.index <= 0;
    const atEnd = STATE.index >= list.length - 1;

    const seq = pad(STATE.index + 1);

    this.view.webview.html = `
      <body style="font-family:sans-serif;padding:10px;">
        <h2>PACT Control</h2>

        <div style="display:flex;justify-content:space-between;">
          <span>${STATE.notebook}</span>
          <span style="color:green;">●</span>
        </div>

        <div>prompt-${seq} / ${list.length}</div>

        <button ${atStart ? "disabled" : ""} onclick="send('prev')">←</button>
        <button ${atEnd ? "disabled" : ""} onclick="send('next')">→</button>

        <br/><br/>

        <button onclick="send('run')">Run Prompt</button>

        <script>
          const vscode = acquireVsCodeApi();
          function send(cmd){ vscode.postMessage({cmd}); }
        </script>
      </body>
    `;
  }

  private async move(delta: number) {
    const list = getPromptList(this.paths, STATE.notebook);
    if (list.length === 0) return;

    const next = STATE.index + delta;

    if (next < 0 || next >= list.length) return;

    STATE.index = next;

    const file = list[next];

    await openPrompt(file);
    this.explorer.reveal(file);

    this.render();
  }

  private async run() {
    const seq = pad(STATE.index + 1);

    const responsesDir = path.join(
      this.paths.notebook(STATE.notebook),
      "artifacts",
      "responses"
    );

    fs.mkdirSync(responsesDir, { recursive: true });

    const file = path.join(responsesDir, `response-${seq}.json`);

    fs.writeFileSync(
      file,
      JSON.stringify(
        {
          sequence: seq,
          text: "Mock response",
          timestamp: new Date().toISOString()
        },
        null,
        2
      )
    );

    await openResponse(file);

    this.explorer.refresh();
    this.explorer.reveal(file);
  }
}

// ---------- EXPLORER ----------

class PactExplorerProvider implements vscode.TreeDataProvider<Item> {
  private _onDidChangeTreeData = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private itemMap = new Map<string, Item>();

  constructor(private paths: PactPaths) {}

  refresh() {
    this._onDidChangeTreeData.fire();
  }

  reveal(file: string) {
    const item = this.itemMap.get(file);
    if (item) {
      TREE.reveal(item, { select: true, focus: true });
    }
  }

  getTreeItem(e: Item) {
    return e;
  }

  getChildren(e?: Item): Thenable<Item[]> {
    if (!e) return Promise.resolve(this.getNotebooks());
    if (e.type === "notebook") return Promise.resolve(this.getFolders(e.name!));
    if (e.type === "folder") return Promise.resolve(this.getFiles(e.path!));
    return Promise.resolve([]);
  }

  private getNotebooks(): Item[] {
    return fs.readdirSync(this.paths.notebooksRoot()).map(name => {
      const i = new vscode.TreeItem(name, 1) as Item;
      i.type = "notebook";
      i.name = name;
      return i;
    });
  }

  private getFolders(name: string): Item[] {
    const base = this.paths.notebook(name);

    return [
      this.makeFolder("prompts", path.join(base, "prompts")),
      this.makeFolder("responses", path.join(base, "artifacts", "responses"))
    ];
  }

  private makeFolder(label: string, p: string): Item {
    const i = new vscode.TreeItem(label, 1) as Item;
    i.type = "folder";
    i.path = p;
    return i;
  }

  private getFiles(folder: string): Item[] {
    if (!fs.existsSync(folder)) return [];

    return fs.readdirSync(folder)
      .filter(f => f.endsWith(".json"))
      .sort((a, b) => extractSeq(a) - extractSeq(b))
      .map(name => {
        const full = path.join(folder, name);

        const item = new vscode.TreeItem(name) as Item;

        item.command = {
          command: "pact.openPrompt",
          title: "Open",
          arguments: [full]
        };

        this.itemMap.set(full, item);

        return item;
      });
  }
}

interface Item extends vscode.TreeItem {
  type?: "notebook" | "folder";
  name?: string;
  path?: string;
}

// ---------- CORE ----------

async function openPrompt(file: string) {
  const json = JSON.parse(fs.readFileSync(file, "utf-8"));

  const text =
    json.content?.map((c: any) => c.value).join("\n") ||
    json.text ||
    "";

  const seq = extractSeq(file);

  const uri = vscode.Uri.parse(`pact:prompt-${pad(seq)}`);

  provider.setContent(text, uri);

  const doc = await vscode.workspace.openTextDocument(uri);

  await vscode.languages.setTextDocumentLanguage(doc, "markdown");

  await vscode.window.showTextDocument(doc, { preview: true });
}

async function openResponse(file: string) {
  const json = JSON.parse(fs.readFileSync(file, "utf-8"));

  const seq = extractSeq(file);

  const uri = vscode.Uri.parse(`pact:response-${pad(seq)}`);

  provider.setContent(json.text || "", uri);

  const doc = await vscode.workspace.openTextDocument(uri);

  await vscode.languages.setTextDocumentLanguage(doc, "markdown");

  await vscode.window.showTextDocument(doc, { preview: true });
}

// ---------- HELPERS ----------

function getNotebook(file: string) {
  const parts = file.split(path.sep);
  return parts[parts.indexOf("notebooks") + 1];
}

function getPromptList(paths: PactPaths, notebook: string) {
  const dir = paths.prompts(notebook);
  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir)
    .filter(f => f.startsWith("prompt-"))
    .sort((a, b) => extractSeq(a) - extractSeq(b))
    .map(f => path.join(dir, f));
}

function extractSeq(file: string): number {
  const match = file.match(/(prompt|response)-(\d+)/);
  return match ? parseInt(match[2], 10) : 0;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}