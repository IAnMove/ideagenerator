import type {
  CodexPromptRequest,
  CodexPromptResponse,
  LlmProvider,
} from "../domain/models.js";
import type { CodexPromptGenerator } from "./ports.js";

interface Defaults {
  useLlm: boolean;
  provider: LlmProvider;
}

export class CodexPromptRouter implements CodexPromptGenerator {
  constructor(
    private readonly local: CodexPromptGenerator,
    private readonly providers: Partial<Record<LlmProvider, CodexPromptGenerator>>,
    private readonly defaults: Defaults,
  ) {}

  async generate(request: CodexPromptRequest): Promise<CodexPromptResponse> {
    const useLlm = request.llm?.enabled ?? this.defaults.useLlm;

    if (!useLlm) {
      return this.local.generate(request);
    }

    const provider = request.llm?.provider ?? this.defaults.provider;
    const generator = this.providers[provider];

    if (!generator) {
      return this.local.generate(request);
    }

    return generator.generate(request);
  }
}
