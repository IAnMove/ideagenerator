import type { CodexPromptRequest, CodexPromptResponse } from "../domain/models.js";
import type { CodexPromptGenerator } from "./ports.js";

export class GenerateCodexPromptUseCase {
  constructor(private readonly generator: CodexPromptGenerator) {}

  async execute(request: CodexPromptRequest): Promise<CodexPromptResponse> {
    return this.generator.generate(request);
  }
}
