import type { CodexPromptGenerator } from "../application/ports.js";
import type {
  CodexPromptRequest,
  CodexPromptResponse,
} from "../domain/models.js";
import {
  buildProductionPrompt,
  buildProductionPromptMessages,
} from "../application/codex-prompt-base.js";

type DeepSeekConfig = {
  apiKey: string;
  baseUrl: string;
  model: string;
  timeoutMs: number;
};

type LlmResponse = { prompt?: string };

export class DeepSeekCodexPromptGenerator implements CodexPromptGenerator {
  constructor(private readonly config: DeepSeekConfig) {}

  async generate(request: CodexPromptRequest): Promise<CodexPromptResponse> {
    const model = request.llm?.model || this.config.model;
    const baseUrl = request.llm?.baseUrl || this.config.baseUrl;
    const apiKey = request.llm?.apiKey || this.config.apiKey;

    if (!apiKey) {
      throw new Error("Missing LLM API key");
    }

    const { system, user } = buildProductionPromptMessages(request);
    const response = await fetch(buildUrl(baseUrl), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.5,
        response_format: { type: "json_object" },
        stream: false,
      }),
      signal: AbortSignal.timeout(this.config.timeoutMs),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `DeepSeek request failed (${response.status}): ${errorText}`,
      );
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data?.choices?.[0]?.message?.content ?? "";
    let prompt = "";
    try {
      const parsed = safeParseJson<LlmResponse>(content);
      prompt = (parsed.prompt ?? "").trim();
    } catch {
      prompt = "";
    }

    if (!prompt) {
      return { prompt: buildProductionPrompt(request) };
    }

    return { prompt };
  }
}

function buildUrl(baseUrl: string): string {
  const trimmed = baseUrl.replace(/\/$/, "");
  return `${trimmed}/chat/completions`;
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
