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

  const language = request.language === "en" ? "en" : "es";

  const fallbackValue = (name: ListName): string => {
    if (language === "en") {
      switch (name) {
        case "sector":
          return "general";
        case "audience":
          return "users";
        case "problem":
          return "a common pain";
        case "productType":
          return "web app";
        case "channel":
          return "organic";
        case "pattern":
          return "ddd";
        case "stack":
          return "typescript";
      }
    }

    switch (name) {
      case "sector":
        return "general";
      case "audience":
        return "usuarios";
      case "problem":
        return "un problema frecuente";
      case "productType":
        return "app web";
      case "channel":
        return "organico";
      case "pattern":
        return "ddd";
      case "stack":
        return "typescript";
    }
  };

  const pickOne = (items: string[]): string => {
    if (items.length === 0) return "";
    return items[Math.floor(Math.random() * items.length)] ?? "";
  };

  const resolve = (name: ListName): string => {
    const config: SelectionConfig | undefined = request.selections[name];
    const list = (lists[name] ?? [])
      .map((item) => item.trim())
      .filter(Boolean);

    if (config?.mode === "manual") {
      const value = (config.value ?? "").trim();
      if (!value) {
        throw new Error(`Missing manual value for ${name}`);
      }
      return value;
    }

    const picked = pickOne(list);
    return picked || fallbackValue(name);
  };

  const resolved: ResolvedSelections = {
    sector: resolve("sector"),
    audience: resolve("audience"),
    problem: resolve("problem"),
    productType: resolve("productType"),
    channel: resolve("channel"),
    pattern: resolve("pattern"),
    stack: resolve("stack"),
  };

  return { resolved, llmOptions };
}
