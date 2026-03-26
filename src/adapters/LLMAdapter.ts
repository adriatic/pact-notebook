export class LLMAdapter {
  async invoke(prompt: string): Promise<string> {

    return "LLM response to: " + prompt;
  }
}
