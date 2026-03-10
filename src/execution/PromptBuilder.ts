export class PromptBuilder {

  static build(promptText: string): string {

    // For now PACT simply forwards the prompt.
    // Later this will assemble context, overlays,
    // notebook history, etc.

    return promptText;

  }

}