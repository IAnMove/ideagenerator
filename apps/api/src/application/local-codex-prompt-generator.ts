import type { CodexPromptGenerator } from "./ports.js";
import type { CodexPromptRequest, CodexPromptResponse } from "../domain/models.js";
import { buildCodexBase, formatIdeaContext } from "./codex-prompt-base.js";

export class LocalCodexPromptGenerator implements CodexPromptGenerator {
  async generate(request: CodexPromptRequest): Promise<CodexPromptResponse> {
    const language = request.language === "en" ? "en" : "es";
    const base = buildCodexBase(language);
    const context = formatIdeaContext(
      request.idea,
      request.templateLevel,
      language,
      request.extraNotes,
      request.constraints,
    );

    const followUp =
      language === "en"
        ? "Add a practical MVP scope, suggested stack, and first milestones."
        : "Agrega un alcance MVP practico, stack sugerido y primeros hitos.";

    const prompt = [base, "", context, "", followUp].join("\n\n");

    return { prompt };
  }
}
