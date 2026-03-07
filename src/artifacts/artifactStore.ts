import * as fs from "fs";
import * as path from "path";
import { randomUUID } from "crypto";
import { NotebookManager } from "../notebook/notebookManager";

export class ArtifactStore {

  private notebookRoot(): string {

    const nm = new NotebookManager();

    nm.initialize();

    return nm.getCurrentNotebookPath();
  }

  private ensureDir(dir: string) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  initialize() {

    const root = this.notebookRoot();

    const artifacts = path.join(root, "artifacts");

    this.ensureDir(path.join(artifacts, "prompts"));
    this.ensureDir(path.join(artifacts, "responses"));
    this.ensureDir(path.join(artifacts, "moderation"));
    this.ensureDir(path.join(artifacts, "instrumentation"));
    this.ensureDir(path.join(artifacts, "proposals"));
    this.ensureDir(path.join(artifacts, "drafts"));
  }

  createPromptArtifact(prompt: string) {

    const id = randomUUID();

    const root = this.notebookRoot();

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

    const root = this.notebookRoot();

    const file = path.join(root, "artifacts/responses", `${id}.json`);

    const artifact = {
      cell_id: id,
      content: response,
      timestamp: new Date().toISOString(),
    };

    fs.writeFileSync(file, JSON.stringify(artifact, null, 2));
  }

  createModerationArtifact(id: string, status: string) {

    const root = this.notebookRoot();

    const file = path.join(root, "artifacts/moderation", `${id}.json`);

    const artifact = {
      cell_id: id,
      moderator_status: status,
      timestamp: new Date().toISOString(),
    };

    fs.writeFileSync(file, JSON.stringify(artifact, null, 2));
  }

  createInstrumentationArtifact(id: string, startTime: number) {

    const root = this.notebookRoot();

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

    const root = this.notebookRoot();

    const file = path.join(root, "artifacts/proposals", `${cellId}.json`);

    const artifact = {
      originating_cell: cellId,
      proposal: proposalText,
      timestamp: new Date().toISOString(),
      status: "PENDING",
    };

    fs.writeFileSync(file, JSON.stringify(artifact, null, 2));
  }

  createDraftArtifact(text: string): string {

    const id = randomUUID();

    const draft = {
      draft_id: id,
      text,
      timestamp: new Date().toISOString(),
      status: "DRAFT"
    };

    const root = this.notebookRoot();

    const file = path.join(root, "artifacts/drafts", `${id}.json`);

    fs.writeFileSync(file, JSON.stringify(draft, null, 2));

    return id;
  }
}