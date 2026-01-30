import type {
  IdeaRequest,
  IdeaResponse,
  ListName,
  ResolvedSelections,
} from "../domain/models.js";
import type { IdeaGenerator, LlmOptions } from "../application/ports.js";

type DeepSeekConfig = {
  apiKey: string;
  baseUrl: string;
  model: string;
  timeoutMs: number;
};

type LlmSelection = {
  mode: "manual" | "random" | "llm" | "none";
  value?: string;
  options?: string[];
};

type LlmInput = {
  language: string;
  templateLevel: string;
  architecture?: string;
  extraNotes?: string;
  constraints?: {
    time?: string;
    effort?: string;
    budget?: string;
  };
  selections: Record<ListName, LlmSelection>;
};

const listNames: ListName[] = [
  "sector",
  "audience",
  "problem",
  "productType",
  "channel",
];

export class DeepSeekIdeaGenerator implements IdeaGenerator {
  constructor(private readonly config: DeepSeekConfig) {}

  async generate(
    request: IdeaRequest,
    resolved: ResolvedSelections,
    llmOptions: LlmOptions,
  ): Promise<IdeaResponse> {
    const input = buildLlmInput(request, resolved, llmOptions);
    const messages = buildMessages(input);
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
      throw new Error(
        `DeepSeek request failed (${response.status}): ${errorText}`,
      );
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
  llmOptions: LlmOptions,
): LlmInput {
  const selectionConfigs: Record<
    ListName,
    { mode: "manual" | "random" | "llm" | "none"; value?: string | null }
  > = {
    sector: request.selections.sector,
    audience: request.selections.audience,
    problem: request.selections.problem,
    productType: request.selections.productType,
    channel: request.selections.channel,
  };

  const selections: Record<ListName, LlmSelection> = {
    sector: { mode: selectionConfigs.sector.mode },
    audience: { mode: selectionConfigs.audience.mode },
    problem: { mode: selectionConfigs.problem.mode },
    productType: { mode: selectionConfigs.productType.mode },
    channel: { mode: selectionConfigs.channel.mode },
  };

  for (const name of listNames) {
    const config = selections[name];
    if (config.mode === "manual") {
      config.value = selectionConfigs[name].value ?? "";
    }

    if (config.mode === "random") {
      config.value = resolved[name];
    }

    if (config.mode === "llm" || config.mode === "none") {
      config.options = llmOptions[name] ?? [];
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

function buildMessages(input: LlmInput) {
  const system =
    "Return ONLY valid JSON. No markdown, no code fences, no commentary.";

  const schema = `{
  "language": "es" | "en",
  "ideas": [
    {
      "title": "...",
      "oneLiner": "...",
      "sector": "...",
      "audience": "...",
      "problem": "...",
      "solution": "...",
      "differentiator": "...",
      "mvp": ["...", "...", "..."],
      "score": { "value": 1-10, "reasons": ["...", "...", "..."] },
      "pros": ["...", "...", "..."],
      "cons": ["...", "...", "..."],
      "painFrequency": "...",
      "willingnessToPay": "...",
      "alternatives": "...",
      "roiImpact": "...",
      "adoptionFriction": "...",
      "acquisition": "...",
      "retention": "...",
      "risks": "..."
    }
  ],
  "prompt": { "intro": "...", "technical": "..." }
}`;

  const user = [
    "You generate app ideas and a technical prompt.",
    "Use the input and rules below.",
    "",
    "RULES:",
    "- Output JSON only, matching the schema exactly.",
    "- Use input.language for all text.",
    "- Consider constraints (time/effort/budget) if provided.",
    "- For each selection:",
    "  - manual: use selection.value as is.",
    "  - random: use selection.value (already randomized).",
    "  - llm: choose ONE value from selection.options; if empty, invent a plausible value.",
    "  - none: treat as unconstrained; choose the best value (use options if provided).",
    "- Prioritize simplicity + Clean Code (easy-to-read code).",
    "- Architecture:",
    "  - If input.architecture is missing/empty: do NOT mention architecture.",
    "  - If input.architecture == \"__llm_best__\": choose the best architecture and justify briefly.",
    "    Put the chosen architecture + rationale at the top of prompt.technical (1-3 lines).",
    "  - Otherwise: follow input.architecture (treat it as a key/name) and align the prompt.technical accordingly.",
    "- Generate exactly 3 ideas.",
    "- Each idea must include the validation fields: painFrequency, willingnessToPay, alternatives, roiImpact, adoptionFriction, acquisition, retention, risks.",
    "- The prompt.technical must include: Clean Code guidance, practical folder structure, endpoints, data models, validations, minimal tests, and a short README outline.",
    "",
    "SCHEMA:",
    schema,
    "",
    "INPUT:",
    JSON.stringify(input, null, 2),
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
