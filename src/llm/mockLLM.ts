export class MockLLM {
  async generateResponse(prompt: string): Promise<string> {
    return `Mock response to: "${prompt}";
        Suggested next prompt:
Explain prompt injection attacks.
`;
  }
}
