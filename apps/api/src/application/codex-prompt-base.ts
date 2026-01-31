import type {
  CodexPromptRequest,
  ElementsConfig,
  LocalizedText,
  ProductionPromptTemplate,
} from "../domain/models.js";

type Language = "es" | "en";

type InputsDetail = {
  value: string;
  label?: string;
  hint?: string;
  description?: string;
};

const DEFAULT_PRODUCTION_PROMPT: Record<Language, string> = {
  es: [
    "Eres un asistente senior. Con el INPUT JSON debajo, crea un prompt operativo para ejecutar la idea.",
    "Si la idea implica software, incluye: arquitectura, stack, estructura de carpetas, endpoints, modelos de datos, validaciones, tests minimos y un esquema corto de README.",
    "Si no implica software, entrega un plan paso a paso con entregables, riesgos/mitigaciones y metricas.",
    "INPUT JSON:",
    "%respuesta%",
  ].join("\n"),
  en: [
    "You are a senior assistant. Using the INPUT JSON below, create an execution prompt to deliver the idea.",
    "If the idea implies software, include: architecture, stack, folder structure, endpoints, data models, validations, minimal tests, and a short README outline.",
    "If it is non-software, provide a step-by-step plan with deliverables, risks/mitigations, and success metrics.",
    "INPUT JSON:",
    "%response%",
  ].join("\n"),
};

export function buildProductionPrompt(request: CodexPromptRequest): string {
  const language: Language = request.language === "en" ? "en" : "es";
  const template = resolveProductionTemplate(request.elements, language);
  const payload = buildProductionPayload(request, language);
  return applyTemplate(template, payload);
}

export function buildProductionPromptMessages(
  request: CodexPromptRequest,
): { system: string; user: string } {
  const language: Language = request.language === "en" ? "en" : "es";
  const template = resolveProductionTemplate(request.elements, language);
  const payload = buildProductionPayload(request, language);
  const system =
    language === "en"
      ? "Return ONLY valid JSON. No markdown, no code fences, no commentary."
      : "Devuelve SOLO JSON valido. Sin markdown, sin bloques de codigo, sin comentarios.";
  const user = buildProductionUserPrompt(language, template, payload);
  return { system, user };
}

function buildProductionUserPrompt(
  language: Language,
  template: string,
  payload: string,
): string {
  const rules =
    language === "en"
      ? [
          "TASK:",
          "You are a prompt engineer. Produce the final production prompt for another LLM to execute the idea.",
          "Use the TEMPLATE as the base. Replace %response% or %respuesta% with the INPUT JSON.",
          "If the template lacks the placeholder, append the INPUT JSON at the end.",
          "Do NOT execute the idea. Output only the prompt.",
          "Return ONLY JSON with this schema:",
          '{"prompt":"..."}',
        ]
      : [
          "TAREA:",
          "Eres un prompt engineer. Genera el prompt de produccion final para que otro LLM ejecute la idea.",
          "Usa el TEMPLATE como base. Sustituye %respuesta% o %response% por el INPUT JSON.",
          "Si el template no incluye el placeholder, agrega el INPUT JSON al final.",
          "No ejecutes la idea. Devuelve solo el prompt.",
          "Devuelve SOLO JSON con este schema:",
          '{"prompt":"..."}',
        ];

  return [
    ...rules,
    "",
    "TEMPLATE:",
    template,
    "",
    "INPUT JSON:",
    payload,
  ].join("\n");
}

function resolveProductionTemplate(
  elements: ElementsConfig | undefined,
  language: Language,
): string {
  const anyElements = elements as
    | (ElementsConfig & { production_prompt?: ProductionPromptTemplate })
    | undefined;
  const rawTemplate =
    anyElements?.productionPrompt ?? anyElements?.production_prompt;

  const resolved = resolveTemplateValue(rawTemplate, language);
  return resolved ?? DEFAULT_PRODUCTION_PROMPT[language];
}

function resolveTemplateValue(
  value: ProductionPromptTemplate | undefined,
  language: Language,
): string | undefined {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  return getLocalizedText(value, language);
}

function getLocalizedText(
  value: LocalizedText | undefined,
  language: Language,
): string | undefined {
  if (!value) return undefined;
  return value[language] ?? value.es ?? value.en ?? Object.values(value)[0];
}

function applyTemplate(template: string, payload: string): string {
  const replaced = template
    .replaceAll("%respuesta%", payload)
    .replaceAll("%response%", payload);

  if (replaced === template) {
    return [template, "", payload].join("\n");
  }

  return replaced;
}

function buildProductionPayload(
  request: CodexPromptRequest,
  language: Language,
): string {
  const idea = request.idea;
  const inputs = { ...(idea.inputs ?? {}) };
  const inputsDetailed = buildInputsDetailed(
    inputs,
    request.elements,
    language,
  );

  const payload = {
    language: request.language,
    templateLevel: request.templateLevel,
    idea: {
      title: idea.title,
      oneLiner: idea.oneLiner,
      solution: idea.solution,
      differentiator: idea.differentiator,
      mvp: idea.mvp,
      score: idea.score,
      pros: idea.pros,
      cons: idea.cons,
      validation: {
        painFrequency: idea.painFrequency,
        willingnessToPay: idea.willingnessToPay,
        alternatives: idea.alternatives,
        roiImpact: idea.roiImpact,
        adoptionFriction: idea.adoptionFriction,
        acquisition: idea.acquisition,
        retention: idea.retention,
        risks: idea.risks,
      },
      inputs,
    },
    inputsDetailed,
    constraints: sanitizeConstraints(request.constraints),
    extraNotes: request.extraNotes?.trim() || undefined,
  };

  return JSON.stringify(removeEmpty(payload), null, 2);
}

function buildInputsDetailed(
  inputs: Record<string, string>,
  elements: ElementsConfig | undefined,
  language: Language,
): Record<string, InputsDetail> | undefined {
  if (!elements) return undefined;

  const categories = new Map(
    elements.categories.map((category) => [category.key, category]),
  );

  const result: Record<string, InputsDetail> = {};

  for (const [key, value] of Object.entries(inputs)) {
    const category = categories.get(key);
    const detail: InputsDetail = { value };

    if (category) {
      const label = getLocalizedText(category.label, language);
      const hint = getLocalizedText(category.hint, language);
      const option = category.options?.[value];
      const description = getLocalizedText(option, language);

      if (label) detail.label = label;
      if (hint) detail.hint = hint;
      if (description) detail.description = description;
    }

    result[key] = detail;
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

function sanitizeConstraints(
  constraints: CodexPromptRequest["constraints"] | undefined,
): CodexPromptRequest["constraints"] | undefined {
  if (!constraints) return undefined;

  const trimmed = {
    time: constraints.time?.trim() || undefined,
    effort: constraints.effort?.trim() || undefined,
    budget: constraints.budget?.trim() || undefined,
  };

  return removeEmpty(trimmed);
}

function removeEmpty<T extends Record<string, unknown>>(value: T): T {
  const entries = Object.entries(value).filter(([, entry]) => {
    if (entry === undefined || entry === null) return false;
    if (typeof entry === "string" && entry.trim() === "") return false;
    if (typeof entry === "object") {
      if (Array.isArray(entry)) return entry.length > 0;
      return Object.keys(entry as Record<string, unknown>).length > 0;
    }
    return true;
  });

  return Object.fromEntries(entries) as T;
}
