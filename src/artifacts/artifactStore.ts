import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { randomUUID } from "crypto";

export class ArtifactStore {
  private workspaceRoot(): string {
    const folder = vscode.workspace.workspaceFolders?.[0];

    if (!folder) {
      throw new Error("No workspace open");
    }

    return folder.uri.fsPath;
  }

  private ensureDir(dir: string) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  initialize() {
    const root = this.workspaceRoot();

    const artifacts = path.join(root, "artifacts");

    this.ensureDir(path.join(artifacts, "prompts"));
    this.ensureDir(path.join(artifacts, "responses"));
    this.ensureDir(path.join(artifacts, "moderation"));
    this.ensureDir(path.join(artifacts, "instrumentation"));
    this.ensureDir(path.join(artifacts, "proposals"));
  }

  createPromptArtifact(prompt: string) {
    const id = randomUUID();

    const root = this.workspaceRoot();

    const file = path.join(root, "artifacts/prompts", `${id}.json`);

    const artifact = {
      cell_id: id,
      text: prompt,
      timestamp: new Date().toISOString(),
    };

    fs.writeFileSync(file, JSON.stringify(artifact, null, 2));

    return id;
  }

  createResponseArtifact(id: string, response: string) {
    const root = this.workspaceRoot();

    const file = path.join(root, "artifacts/responses", `${id}.json`);

    const artifact = {
      cell_id: id,
      content: response,
      timestamp: new Date().toISOString(),
    };

    fs.writeFileSync(file, JSON.stringify(artifact, null, 2));
  }

  createModerationArtifact(id: string, status: string) {
    const root = this.workspaceRoot();

    const file = path.join(root, "artifacts/moderation", `${id}.json`);

    const artifact = {
      cell_id: id,
      moderator_status: status,
      timestamp: new Date().toISOString(),
    };

    fs.writeFileSync(file, JSON.stringify(artifact, null, 2));
  }

  createInstrumentationArtifact(id: string, startTime: number) {
    const root = this.workspaceRoot();

    const file = path.join(root, "artifacts/instrumentation", `${id}.json`);

    const latency = Date.now() - startTime;

    const artifact = {
      cell_id: id,
      latency_ms: latency,
      timestamp: new Date().toISOString(),
      model: "mock-llm",
    };

    fs.writeFileSync(file, JSON.stringify(artifact, null, 2));
  }

  createProposalArtifact(cellId: string, proposalText: string) {
    const root = this.workspaceRoot();

    const file = path.join(root, "artifacts/proposals", `${cellId}.json`);

    const artifact = {
      originating_cell: cellId,
      proposal: proposalText,
      timestamp: new Date().toISOString(),
      status: "PENDING",
    };

    fs.writeFileSync(file, JSON.stringify(artifact, null, 2));
  }
}
