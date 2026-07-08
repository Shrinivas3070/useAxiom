export interface LLMProvider {
  name: string;
  generateText(prompt: string): Promise<string>;
}

export class MockLLMProvider implements LLMProvider {
  constructor(public name: string) {}

  async generateText(prompt: string): Promise<string> {
    return `Mock LLM (${this.name}) response for: ${prompt}`;
  }
}
