import type { IdeaRequest, IdeaResponse } from "../domain/models.js";
import type { IdeaGenerator, ListsRepository } from "./ports.js";
import { resolveSelections } from "./resolve-selections.js";

export class GenerateIdeasUseCase {
  constructor(
    private readonly listsRepo: ListsRepository,
    private readonly generator: IdeaGenerator,
  ) {}

  async execute(request: IdeaRequest): Promise<IdeaResponse> {
    const storeLists = await this.listsRepo.getAllLists();
    const elementsLists: Record<string, string[]> = {};

    if (request.elements) {
      for (const category of request.elements.categories) {
        elementsLists[category.key] = Object.keys(category.options ?? {});
      }
    }

    const lists = { ...storeLists, ...elementsLists };
    const { resolved, llmOptions } = resolveSelections(request, lists);
    return this.generator.generate(request, resolved, llmOptions);
  }
}
