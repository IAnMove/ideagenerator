import type {
  IdeaRequest,
  IdeaResponse,
  ListName,
  ResolvedSelections,
} from "../domain/models.js";
import type { IdeaGenerator, LlmOptions } from "../application/ports.js";
import {
  buildIdeaPromptMessages,
  type IdeaPromptInput,
} from "../application/idea-prompt-template.js";

type OpenAiConfig = {
  apiKey: string;
  baseUrl: string;
  model: string;
  timeoutMs: number;
};

type LlmSelection = {
  mode: "manual";
  value: string;
} | { mode: "decide" };

type LlmInput = IdeaPromptInput;

export class OpenAiIdeaGenerator implements IdeaGenerator {
  constructor(private readonly config: OpenAiConfig) {}

  async generate(
    request: IdeaRequest,
    resolved: ResolvedSelections,
    llmOptions: LlmOptions,
  ): Promise<IdeaResponse> {
    const input = buildLlmInput(request, resolved);
    const { system, user } = buildIdeaPromptMessages(input);
    const messages = [
      { role: "system", content: system },
      { role: "user", content: user },
    ];
    const model = request.llm?.model || this.config.model;
    const baseUrl = request.llm?.baseUrl || this.config.baseUrl;
    const apiKey = request.llm?.apiKey || this.config.apiKey;

    if (!apiKey) {
      throw new Error("Missing LLM API key");
    }

    const response = await fetch(buildUrl(baseUrl), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        response_format: { type: "json_object" },
        stream: false,
      }),
      signal: AbortSignal.timeout(this.config.timeoutMs),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI request failed (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data?.choices?.[0]?.message?.content ?? "";
    const parsed = safeParseJson<IdeaResponse>(content);

    const fallbackLanguage = request.language === "en" ? "en" : "es";

    return {
      language: parsed.language ?? fallbackLanguage,
      ideas: parsed.ideas ?? [],
      prompt: parsed.prompt ?? { intro: "", technical: "" },
      suggestedLanguage: parsed.suggestedLanguage,
    };
  }
}

function buildUrl(baseUrl: string): string {
  const trimmed = baseUrl.replace(/\/$/, "");
  return `${trimmed}/chat/completions`;
}

function buildLlmInput(
  request: IdeaRequest,
  resolved: ResolvedSelections,
): LlmInput {
  const selections: Record<ListName, LlmSelection> = {};

  for (const [name, config] of Object.entries(request.selections ?? {})) {
    if (!config || config.mode === "ignore") continue;

    if (config.mode === "manual") {
      selections[name] = { mode: "manual", value: (config.value ?? "").trim() };
      continue;
    }

    if (config.mode === "random") {
      const resolvedValue = resolved[name]?.trim();
      if (resolvedValue) {
        selections[name] = { mode: "manual", value: resolvedValue };
      }
      continue;
    }
  }

  return {
    language: request.language,
    templateLevel: request.templateLevel,
    architecture: request.architecture?.trim() || undefined,
    extraNotes: request.extraNotes,
    constraints: request.constraints,
    selections,
  };
}

function safeParseJson<T>(raw: string): T {
  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    const first = trimmed.indexOf("{");
    const last = trimmed.lastIndexOf("}");
    if (first >= 0 && last > first) {
      const sliced = trimmed.slice(first, last + 1);
      return JSON.parse(sliced) as T;
    }
    throw new Error("Failed to parse JSON from LLM response");
  }
}
