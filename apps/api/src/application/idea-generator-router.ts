import type {
  IdeaRequest,
  IdeaResponse,
  LlmProvider,
  ResolvedSelections,
} from "../domain/models.js";
import type { IdeaGenerator, LlmOptions } from "../application/ports.js";

interface Defaults {
  useLlm: boolean;
  provider: LlmProvider;
}

export class IdeaGeneratorRouter implements IdeaGenerator {
  constructor(
    private readonly local: IdeaGenerator,
    private readonly providers: Partial<Record<LlmProvider, IdeaGenerator>>,
    private readonly defaults: Defaults,
  ) {}

  async generate(
    request: IdeaRequest,
    resolved: ResolvedSelections,
    llmOptions: LlmOptions,
  ): Promise<IdeaResponse> {
    const useLlm = request.llm?.enabled ?? this.defaults.useLlm;

    if (!useLlm) {
      return this.local.generate(request, resolved, llmOptions);
    }

    const provider = request.llm?.provider ?? this.defaults.provider;
    const generator = this.providers[provider];

    if (!generator) {
      return this.local.generate(request, resolved, llmOptions);
    }

    return generator.generate(request, resolved, llmOptions);
  }
}
