import type { CodexPromptGenerator } from "./ports.js";
import type { CodexPromptRequest, CodexPromptResponse } from "../domain/models.js";
import { buildCodexBase, formatIdeaContext } from "./codex-prompt-base.js";

export class LocalCodexPromptGenerator implements CodexPromptGenerator {
  async generate(request: CodexPromptRequest): Promise<CodexPromptResponse> {
    const language = request.language === "en" ? "en" : "es";
    const base = buildCodexBase(language, request.architecture);
    const context = formatIdeaContext(
      request.idea,
      request.templateLevel,
      language,
      request.extraNotes,
      request.constraints,
      request.architecture,
      request.pattern,
      request.stack,
    );

    const followUp =
      language === "en"
        ? "Add a practical MVP scope, confirm/choose stack and pattern, and list first milestones."
        : "Agrega un alcance MVP practico, confirma/elige stack y patron, y lista los primeros hitos.";

    const prompt = [base, "", context, "", followUp].join("\n\n");

    return { prompt };
  }
}
