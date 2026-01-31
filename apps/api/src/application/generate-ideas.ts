import type { IdeaRequest, IdeaResponse } from "../domain/models.js";
import type { IdeaGenerator, ListsRepository } from "./ports.js";
import { resolveSelections } from "./resolve-selections.js";

export class GenerateIdeasUseCase {
  constructor(
    private readonly listsRepo: ListsRepository,
    private readonly generator: IdeaGenerator,
  ) {}

  async execute(request: IdeaRequest): Promise<IdeaResponse> {
    const lists = request.elements
      ? Object.fromEntries(
          request.elements.categories.map((category) => [
            category.key,
            Object.keys(category.options ?? {}),
          ]),
        )
      : await this.listsRepo.getAllLists();

    const { resolved, llmOptions } = resolveSelections(request, lists);
    return this.generator.generate(request, resolved, llmOptions);
  }
}
