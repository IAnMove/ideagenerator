import type { CodexPromptGenerator } from "../application/ports.js";
import type {
  CodexPromptRequest,
  CodexPromptResponse,
} from "../domain/models.js";
import { buildCodexBase, formatIdeaContext } from "../application/codex-prompt-base.js";

type DeepSeekConfig = {
  apiKey: string;
  baseUrl: string;
  model: string;
  timeoutMs: number;
};

type LlmResponse = { addendum: string };

export class DeepSeekCodexPromptGenerator implements CodexPromptGenerator {
  constructor(private readonly config: DeepSeekConfig) {}

  async generate(request: CodexPromptRequest): Promise<CodexPromptResponse> {
    const language = request.language === "en" ? "en" : "es";
    const base = buildCodexBase(language, request.architecture);
    const context = formatIdeaContext(
      request.idea,
      request.templateLevel,
      language,
      request.extraNotes,
      request.constraints,
      request.architecture,
      request.pattern,
      request.stack,
    );

    const model = request.llm?.model || this.config.model;
    const baseUrl = request.llm?.baseUrl || this.config.baseUrl;
    const apiKey = request.llm?.apiKey || this.config.apiKey;

    if (!apiKey) {
      throw new Error("Missing LLM API key");
    }

    const messages = buildMessages(language, context);
    const response = await fetch(buildUrl(baseUrl), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.6,
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
    const parsed = safeParseJson<LlmResponse>(content);
    const addendum = (parsed.addendum ?? "").trim();

    const prompt = [base, "", context, "", addendum]
      .filter(Boolean)
      .join("\n\n");

    return { prompt };
  }
}

function buildUrl(baseUrl: string): string {
  const trimmed = baseUrl.replace(/\/$/, "");
  return `${trimmed}/chat/completions`;
}

function buildMessages(language: "es" | "en", context: string) {
  const system =
    "Return ONLY valid JSON. No markdown, no code fences, no commentary.";

  const rules =
    language === "en"
      ? [
          "You generate an addendum for a Codex prompt.",
          "Do NOT repeat the base instructions or the idea context.",
          "Return only the addendum as JSON:",
          '{"addendum":"..."}',
          "Keep it concise, practical, and actionable.",
          "If the idea context already specifies a stack or pattern, follow it (do not propose a different one).",
          "Include: MVP scope, stack suggestion (if missing), pattern suggestion (if missing), and first milestones.",
        ]
      : [
          "Generas un addendum para un prompt de Codex.",
          "No repitas las instrucciones base ni el contexto de la idea.",
          "Devuelve solo el addendum en JSON:",
          '{"addendum":"..."}',
          "Mantenlo conciso, practico y accionable.",
          "Si el contexto ya especifica stack o patron, respetalo (no propongas otro distinto).",
          "Incluye: alcance MVP, stack sugerido (si falta), patron sugerido (si falta) y primeros hitos.",
        ];

  const user = [
    ...rules,
    "",
    language === "en" ? "IDEA CONTEXT:" : "CONTEXTO DE IDEA:",
    context,
  ].join("\n");

  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
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
