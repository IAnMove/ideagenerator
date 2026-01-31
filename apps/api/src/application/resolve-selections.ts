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
    const fallbackEn: Record<string, string> = {
      sector: "general",
      audience: "users",
      problem: "a common pain",
      productType: "web app",
      channel: "organic",
      pattern: "ddd",
      stack: "typescript",
    };

    const fallbackEs: Record<string, string> = {
      sector: "general",
      audience: "usuarios",
      problem: "un problema frecuente",
      productType: "app web",
      channel: "organico",
      pattern: "ddd",
      stack: "typescript",
    };

    const map = language === "en" ? fallbackEn : fallbackEs;
    return map[name] ?? "general";
  };

  const pickOne = (items: string[]): string => {
    if (items.length === 0) return "";
    return items[Math.floor(Math.random() * items.length)] ?? "";
  };

  const resolve = (name: ListName, config?: SelectionConfig): string => {
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

  const resolved: ResolvedSelections = {};

  for (const [name, config] of Object.entries(request.selections ?? {})) {
    if (config?.mode === "ignore") continue;
    resolved[name] = resolve(name, config);
  }

  return { resolved, llmOptions };
}
