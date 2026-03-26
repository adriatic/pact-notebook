import * as vscode from "vscode";
import * as fs from "fs";
import { getPromptLabel } from "../prompt/promptLabel";
import { extractText } from "../prompt/promptAdapter";

export function createPromptTreeItem(fullPath: string) {
  const raw = fs.readFileSync(fullPath, "utf-8");
  const cell = JSON.parse(raw);

  const label = getPromptLabel(cell);

  const item = new vscode.TreeItem(label);
  item.tooltip = fullPath;

  item.command = {
    command: "pact.copyPrompt",
    title: "Copy Prompt",
    arguments: [fullPath]
  };

  item.contextValue = "prompt";

  return item;
}