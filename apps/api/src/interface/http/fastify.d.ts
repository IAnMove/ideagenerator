import "fastify";
import type { GenerateIdeasUseCase } from "../../application/generate-ideas.js";
import type { GenerateCodexPromptUseCase } from "../../application/generate-codex-prompt.js";
import type { ListsRepository } from "../../application/ports.js";

declare module "fastify" {
  interface FastifyInstance {
    listsRepo: ListsRepository;
    generateIdeas: GenerateIdeasUseCase;
    generateCodexPrompt: GenerateCodexPromptUseCase;
  }
}
