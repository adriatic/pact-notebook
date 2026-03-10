export class LLMAdapter {
  async invoke(prompt: string): Promise<string> {
    console.log("LLM prompt:", prompt);

    return "LLM response to: " + prompt;
  }
}
