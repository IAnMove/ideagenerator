import type { CodexPromptGenerator } from "./ports.js";
import type { CodexPromptRequest, CodexPromptResponse } from "../domain/models.js";
import { buildProductionPrompt } from "./codex-prompt-base.js";

export class LocalCodexPromptGenerator implements CodexPromptGenerator {
  async generate(request: CodexPromptRequest): Promise<CodexPromptResponse> {
    return { prompt: buildProductionPrompt(request) };
  }
}
