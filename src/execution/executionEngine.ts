import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { MockLLM } from "../llm/mockLLM";
import { Moderator } from "../moderator/moderator";
import { ArtifactStore } from "../artifacts/artifactStore";
import { NotebookEngine } from "../notebook/notebookEngine";

export class ExecutionEngine {
  private llm: MockLLM;
  private moderator: Moderator;
  private artifacts: ArtifactStore;
  private notebook: NotebookEngine;

  constructor() {
    this.llm = new MockLLM();
    this.moderator = new Moderator();
    this.artifacts = new ArtifactStore();
    this.notebook = new NotebookEngine();
  }

  async executePrompt(prompt: string): Promise<string> {
    this.artifacts.initialize();
    this.notebook.initializeNotebook();

    const startTime = Date.now();

    const cellId = this.artifacts.createPromptArtifact(prompt);

    const moderation = this.moderator.checkPrompt(prompt);

    this.artifacts.createModerationArtifact(cellId, moderation.status);

    if (moderation.status === "BLOCK") {
      return "Prompt blocked by moderator.";
    }

    const response = await this.llm.generateResponse(prompt);

    const proposalMarker = "Suggested next prompt:";

    if (response.includes(proposalMarker)) {
      const proposal = response.split(proposalMarker)[1].trim();

      this.artifacts.createProposalArtifact(cellId, proposal);
    }
    this.artifacts.createResponseArtifact(cellId, response);

    this.artifacts.createInstrumentationArtifact(cellId, startTime);

    this.notebook.appendCell({
      cell_id: cellId,
      state: "COMPLETED",

      prompt_ref: `artifacts/prompts/${cellId}.json`,
      response_ref: `artifacts/responses/${cellId}.json`,
      moderation_ref: `artifacts/moderation/${cellId}.json`,
      instrumentation_ref: `artifacts/instrumentation/${cellId}.json`,
    });

    return response;
  }

  async approveProposal(): Promise<void> {
    const workspace = vscode.workspace.workspaceFolders?.[0];

    if (!workspace) {
      vscode.window.showErrorMessage("No workspace open.");
      return;
    }

    const proposalsDir = path.join(workspace.uri.fsPath, "artifacts/proposals");

    const files = fs.readdirSync(proposalsDir);

    if (files.length === 0) {
      vscode.window.showInformationMessage("No proposals available.");
      return;
    }

    const pick = await vscode.window.showQuickPick(files);

    if (!pick) {
      return;
    }

    const proposalPath = path.join(proposalsDir, pick);

    const proposal = JSON.parse(fs.readFileSync(proposalPath, "utf8"));

    const prompt = proposal.proposal;

    // mark proposal as approved
    proposal.status = "APPROVED";
    proposal.approved_timestamp = new Date().toISOString();

    fs.writeFileSync(proposalPath, JSON.stringify(proposal, null, 2));

    await this.executePrompt(prompt);
  }
}
