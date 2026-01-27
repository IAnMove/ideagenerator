import type {
  IdeaRequest,
  ListName,
  ResolvedSelections,
  SelectionConfig,
} from "../domain/models.js";
import type { LlmOptions } from "./ports.js";

export interface ResolveResult {
  resolved: ResolvedSelections;
  llmOptions: LlmOptions;
}

export function resolveSelections(
  request: IdeaRequest,
  lists: Record<ListName, string[]>,
): ResolveResult {
  const llmOptions: LlmOptions = {};

  const resolve = (name: ListName, config: SelectionConfig): string => {
    const list = lists[name] ?? [];

    if (config.mode === "manual") {
      const value = (config.value ?? "").trim();
      if (!value) {
        throw new Error(`Missing manual value for ${name}`);
      }
      return value;
    }

    if (config.mode === "none") {
      llmOptions[name] = list;
      return "sin definir";
    }

    if (config.mode === "llm") {
      llmOptions[name] = list;
      if (list.length === 0) {
        return "sin definir";
      }
      return list[Math.floor(Math.random() * list.length)];
    }

    if (list.length === 0) {
      throw new Error(`List '${name}' is empty`);
    }

    return list[Math.floor(Math.random() * list.length)];
  };

  const resolved: ResolvedSelections = {
    sector: resolve("sector", request.selections.sector),
    audience: resolve("audience", request.selections.audience),
    problem: resolve("problem", request.selections.problem),
    productType: resolve("productType", request.selections.productType),
    channel: resolve("channel", request.selections.channel),
  };

  return { resolved, llmOptions };
}
