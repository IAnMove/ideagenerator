import { useEffect, useMemo, useState } from "react";

import type { ChangeEvent } from "react";
import defaultOptions from "./data/default-options.json";

type SelectionMode = "manual" | "decide" | "random" | "ignore";

type ListName = string;

type SelectionConfig = {
  mode: SelectionMode;
  value: string;
};

type IdeaScore = { value: number; reasons: string[] };

type Idea = {
  title: string;
  oneLiner: string;
  inputs: Record<string, string>;
  solution: string;
  differentiator: string;
  mvp: string[];
  score: IdeaScore;
  pros: string[];
  cons: string[];
  painFrequency: string;
  willingnessToPay: string;
  alternatives: string;
  roiImpact: string;
  adoptionFriction: string;
  acquisition: string;
  retention: string;
  risks: string;
};

type IdeaResponse = {
  language: string;
  ideas: Idea[];
  prompt: { intro: string; technical: string };
  suggestedLanguage?: string;
};

type CodexPromptResponse = {
  prompt: string;
};

type ProductionPromptResponse = {
  prompt: string;
};

type Lists = Record<ListName, string[]>;

type LanguageCode = "es" | "en";

type LlmProvider = "deepseek" | "openai";

type Constraints = {
  time: string;
  effort: string;
  budget: string;
};

type LocalizedText = Record<string, string>;

type LocalizedDescriptions = Record<string, LocalizedText>;

type PromptTemplate = string | LocalizedText;

type InputsDetail = {
  value: string;
  label?: string;
  hint?: string;
  description?: string;
};

type ElementCategory = {
  key: string;
  label?: LocalizedText;
  hint?: LocalizedText;
  options: LocalizedDescriptions;
};

type ElementsConfig = {
  version: 1;
  categories: ElementCategory[];
  ideaPrompt?: PromptTemplate;
  ideaSystemPrompt?: PromptTemplate;
  productionPrompt?: PromptTemplate;
  productionSystemPrompt?: PromptTemplate;
};

const ELEMENTS_STORAGE_KEY = "idea-forge.elements.v1";

type DefaultPromptOptions = {
  idea_prompt?: PromptTemplate;
  idea_system_prompt?: PromptTemplate;
  production_prompt?: PromptTemplate;
  production_system_prompt?: PromptTemplate;
  ideaPrompt?: PromptTemplate;
  ideaSystemPrompt?: PromptTemplate;
  productionPrompt?: PromptTemplate;
  productionSystemPrompt?: PromptTemplate;
};

const defaultPromptOptions = defaultOptions as DefaultPromptOptions;

const defaultElements: ElementsConfig = {
  version: 1,
  ideaSystemPrompt:
    defaultPromptOptions.idea_system_prompt ??
    defaultPromptOptions.ideaSystemPrompt,
  ideaPrompt:
    defaultPromptOptions.idea_prompt ?? defaultPromptOptions.ideaPrompt,
  productionPrompt:
    defaultPromptOptions.production_prompt ??
    defaultPromptOptions.productionPrompt,
  productionSystemPrompt:
    defaultPromptOptions.production_system_prompt ??
    defaultPromptOptions.productionSystemPrompt,
  categories: [
    {
      key: "sector",
      label: { es: "Sector", en: "Sector" },
      hint: { es: "Ej: finanzas, salud, educacion", en: "Ex: finance, health, education" },
      options: defaultOptions.sector as LocalizedDescriptions,
    },
    {
      key: "audience",
      label: { es: "Publico", en: "Audience" },
      hint: { es: "Ej: nomadas digitales, pymes", en: "Ex: digital nomads, SMBs" },
      options: defaultOptions.audience as LocalizedDescriptions,
    },
    {
      key: "problem",
      label: { es: "Problema", en: "Problem" },
      hint: { es: "Ej: gestion de ingresos", en: "Ex: income tracking" },
      options: defaultOptions.problem as LocalizedDescriptions,
    },
    {
      key: "productType",
      label: { es: "Tipo de producto", en: "Product type" },
      hint: { es: "Ej: saas, mobile app", en: "Ex: SaaS, mobile app" },
      options: defaultOptions.productType as LocalizedDescriptions,
    },
    {
      key: "channel",
      label: { es: "Canal", en: "Channel" },
      hint: { es: "Ej: seo, comunidades", en: "Ex: SEO, communities" },
      options: defaultOptions.channel as LocalizedDescriptions,
    },
    {
      key: "architecture",
      label: { es: "Arquitectura", en: "Architecture" },
      hint: {
        es: "Ej: clean_architecture, hexagonal_ports_and_adapters",
        en: "Ex: clean_architecture, hexagonal_ports_and_adapters",
      },
      options: defaultOptions.architectures as LocalizedDescriptions,
    },
    {
      key: "pattern",
      label: { es: "Patron", en: "Pattern" },
      hint: { es: "Ej: ddd, cqrs", en: "Ex: ddd, cqrs" },
      options: defaultOptions.patterns as LocalizedDescriptions,
    },
    {
      key: "stack",
      label: { es: "Stack", en: "Stack" },
      hint: { es: "Ej: react_typescript, django_python", en: "Ex: react_typescript, django_python" },
      options: defaultOptions.programming_languages as LocalizedDescriptions,
    },
  ],
};

function formatKeyLabel(value: string): string {
  const normalized = value.trim().replace(/[-_]+/g, " ");
  return normalized.replace(/\b\w/g, (match) => match.toUpperCase());
}

function safeParseJson(raw: string): unknown {
  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    const first = trimmed.indexOf("{");
    const last = trimmed.lastIndexOf("}");
    if (first >= 0 && last > first) {
      const sliced = trimmed.slice(first, last + 1);
      return JSON.parse(sliced) as unknown;
    }
    throw new Error("Invalid JSON");
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isStringRecord(value: unknown): value is Record<string, string> {
  if (!isRecord(value)) return false;
  return Object.values(value).every((item) => typeof item === "string");
}

function isPromptTemplate(
  value: unknown,
): value is PromptTemplate {
  return typeof value === "string" || isStringRecord(value);
}

function isLocalizedDescriptions(value: unknown): value is LocalizedDescriptions {
  if (!isRecord(value)) return false;
  return Object.values(value).every(isStringRecord);
}

function getLocalizedText(
  value: LocalizedText | undefined,
  language: LanguageCode,
): string | undefined {
  if (!value) return undefined;
  return value[language] ?? value.es ?? value.en ?? Object.values(value)[0];
}

function formatOptionLabel(value: string): string {
  return /[-_]/.test(value) ? formatKeyLabel(value) : value;
}

function isElementsConfig(value: unknown): value is ElementsConfig {
  if (!isRecord(value)) return false;
  if (value.version !== 1) return false;
  if (!Array.isArray(value.categories)) return false;

  const promptValues = [
    (value as { ideaPrompt?: unknown }).ideaPrompt ??
      (value as { idea_prompt?: unknown }).idea_prompt,
    (value as { ideaSystemPrompt?: unknown }).ideaSystemPrompt ??
      (value as { idea_system_prompt?: unknown }).idea_system_prompt,
    (value as { productionPrompt?: unknown }).productionPrompt ??
      (value as { production_prompt?: unknown }).production_prompt,
    (value as { productionSystemPrompt?: unknown }).productionSystemPrompt ??
      (value as { production_system_prompt?: unknown }).production_system_prompt,
  ];

  for (const promptValue of promptValues) {
    if (promptValue !== undefined && !isPromptTemplate(promptValue)) {
      return false;
    }
  }

  const keys = new Set<string>();

  for (const category of value.categories) {
    if (!isRecord(category)) return false;
    if (typeof category.key !== "string" || !category.key.trim()) return false;
    if (keys.has(category.key)) return false;
    keys.add(category.key);
    if (category.label !== undefined && !isStringRecord(category.label)) return false;
    if (category.hint !== undefined && !isStringRecord(category.hint)) return false;
    if (!isLocalizedDescriptions(category.options)) return false;
  }

  return true;
}

function normalizeElementsConfig(value: ElementsConfig): ElementsConfig {
  const legacy = value as ElementsConfig & {
    idea_prompt?: PromptTemplate;
    idea_system_prompt?: PromptTemplate;
    production_prompt?: PromptTemplate;
    production_system_prompt?: PromptTemplate;
  };

  return {
    ...legacy,
    ideaPrompt: legacy.ideaPrompt ?? legacy.idea_prompt,
    ideaSystemPrompt: legacy.ideaSystemPrompt ?? legacy.idea_system_prompt,
    productionPrompt: legacy.productionPrompt ?? legacy.production_prompt,
    productionSystemPrompt:
      legacy.productionSystemPrompt ?? legacy.production_system_prompt,
  };
}

function buildSelectionState(
  keys: string[],
  existing?: Record<string, SelectionConfig>,
): Record<string, SelectionConfig> {
  const next: Record<string, SelectionConfig> = {};
  for (const key of keys) {
    const current = existing?.[key];
    next[key] = current ?? { mode: "decide", value: "" };
  }
  return next;
}

function buildTextState(
  keys: string[],
  existing?: Record<string, string>,
): Record<string, string> {
  const next: Record<string, string> = {};
  for (const key of keys) {
    next[key] = existing?.[key] ?? "";
  }
  return next;
}

function isIdeaScore(value: unknown): value is IdeaScore {
  if (!isRecord(value)) return false;
  return typeof value.value === "number" && isStringArray(value.reasons);
}

function isIdea(value: unknown): value is Idea {
  if (!isRecord(value)) return false;
  return (
    typeof value.title === "string" &&
    typeof value.oneLiner === "string" &&
    isStringRecord(value.inputs) &&
    typeof value.solution === "string" &&
    typeof value.differentiator === "string" &&
    isStringArray(value.mvp) &&
    isIdeaScore(value.score) &&
    isStringArray(value.pros) &&
    isStringArray(value.cons) &&
    typeof value.painFrequency === "string" &&
    typeof value.willingnessToPay === "string" &&
    typeof value.alternatives === "string" &&
    typeof value.roiImpact === "string" &&
    typeof value.adoptionFriction === "string" &&
    typeof value.acquisition === "string" &&
    typeof value.retention === "string" &&
    typeof value.risks === "string"
  );
}

function isIdeaResponse(value: unknown): value is IdeaResponse {
  if (!isRecord(value)) return false;
  if (typeof value.language !== "string") return false;
  if (!Array.isArray(value.ideas) || !value.ideas.every(isIdea)) return false;
  if (!isRecord(value.prompt)) return false;
  if (typeof value.prompt.intro !== "string") return false;
  if (typeof value.prompt.technical !== "string") return false;
  if (
    value.suggestedLanguage !== undefined &&
    typeof value.suggestedLanguage !== "string"
  ) {
    return false;
  }
  return true;
}

function isProductionPromptResponse(
  value: unknown,
): value is ProductionPromptResponse {
  return isRecord(value) && typeof value.prompt === "string";
}

type ChatPromptSelection = { mode: "manual"; value: string };

type ChatPromptInput = {
  language: LanguageCode;
  templateLevel: "basic" | "advanced";
  extraNotes?: string;
  constraints?: {
    time?: string;
    effort?: string;
    budget?: string;
  };
  selections: Partial<Record<ListName, ChatPromptSelection>>;
};

type ProductionLlmInput = {
  language: LanguageCode;
  templateLevel: "basic" | "advanced";
  idea: Idea;
  ideaPrompt?: { intro: string; technical: string };
  elements?: ElementsConfig;
  extraNotes?: string;
  constraints?: {
    time?: string;
    effort?: string;
    budget?: string;
  };
};

const ideaResponseSchema = `{
  "language": "es" | "en",
  "ideas": [
    {
      "title": "...",
      "oneLiner": "...",
      "inputs": { "<category_key>": "..." },
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

const productionPromptSchema = `{
  "prompt": "..."
}`;

function resolveIdeaTemplate(
  elements: ElementsConfig | undefined,
  language: LanguageCode,
): string {
  const template =
    elements?.ideaPrompt ??
    (elements as { idea_prompt?: PromptTemplate } | undefined)?.idea_prompt ??
    defaultElements.ideaPrompt;
  if (typeof template === "string") return template;
  return getLocalizedText(template, language) ?? "";
}

function resolveIdeaSystemPrompt(
  elements: ElementsConfig | undefined,
  language: LanguageCode,
): string {
  const system =
    elements?.ideaSystemPrompt ??
    (elements as { idea_system_prompt?: PromptTemplate } | undefined)
      ?.idea_system_prompt ??
    defaultElements.ideaSystemPrompt;
  if (typeof system === "string") return system;
  return getLocalizedText(system, language) ?? "";
}

function resolveProductionTemplate(
  elements: ElementsConfig | undefined,
  language: LanguageCode,
): string {
  const template =
    elements?.productionPrompt ??
    (elements as { production_prompt?: PromptTemplate } | undefined)
      ?.production_prompt ??
    defaultElements.productionPrompt;
  if (typeof template === "string") return template;
  return getLocalizedText(template, language) ?? "";
}

function resolveProductionSystemPrompt(
  elements: ElementsConfig | undefined,
  language: LanguageCode,
): string {
  const system =
    elements?.productionSystemPrompt ??
    (elements as { production_system_prompt?: PromptTemplate } | undefined)
      ?.production_system_prompt ??
    defaultElements.productionSystemPrompt;
  if (typeof system === "string") return system;
  return getLocalizedText(system, language) ?? "";
}

function buildInputsDetailed(
  inputs: Record<string, string>,
  elements: ElementsConfig | undefined,
  language: LanguageCode,
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

function buildProductionPayload(input: ProductionLlmInput): string {
  const constraints = input.constraints;
  const trimmedConstraints = {
    time: constraints?.time?.trim() || undefined,
    effort: constraints?.effort?.trim() || undefined,
    budget: constraints?.budget?.trim() || undefined,
  };

  const inputs = { ...(input.idea.inputs ?? {}) };
  const inputsDetailed = buildInputsDetailed(
    inputs,
    input.elements,
    input.language,
  );

  const payload = {
    language: input.language,
    templateLevel: input.templateLevel,
    idea: {
      title: input.idea.title,
      oneLiner: input.idea.oneLiner,
      solution: input.idea.solution,
      differentiator: input.idea.differentiator,
      mvp: input.idea.mvp,
      score: input.idea.score,
      pros: input.idea.pros,
      cons: input.idea.cons,
      validation: {
        painFrequency: input.idea.painFrequency,
        willingnessToPay: input.idea.willingnessToPay,
        alternatives: input.idea.alternatives,
        roiImpact: input.idea.roiImpact,
        adoptionFriction: input.idea.adoptionFriction,
        acquisition: input.idea.acquisition,
        retention: input.idea.retention,
        risks: input.idea.risks,
      },
      inputs,
    },
    ideaPrompt: input.ideaPrompt,
    inputsDetailed,
    constraints: removeEmpty(trimmedConstraints),
    extraNotes: input.extraNotes?.trim() || undefined,
  };

  return JSON.stringify(removeEmpty(payload), null, 2);
}

function buildProductionChatPrompt(
  language: LanguageCode,
  template: string,
  payload: string,
  elements: ElementsConfig | undefined,
): string {
  const system = resolveProductionSystemPrompt(elements, language);

  const rules =
    language === "en"
      ? [
          "TASK:",
          "You are a prompt engineer. Produce the final production prompt for another LLM to execute the idea.",
          "Use the TEMPLATE as the base. Replace %response% or %respuesta% with the INPUT JSON.",
          "If the template lacks the placeholder, append the INPUT JSON at the end.",
          "Do NOT execute the idea. Output only the prompt.",
          "Return ONLY JSON with this schema:",
          productionPromptSchema,
        ]
      : [
          "TAREA:",
          "Eres un prompt engineer. Genera el prompt de produccion final para que otro LLM ejecute la idea.",
          "Usa el TEMPLATE como base. Sustituye %respuesta% o %response% por el INPUT JSON.",
          "Si el template no incluye el placeholder, agrega el INPUT JSON al final.",
          "No ejecutes la idea. Devuelve solo el prompt.",
          "Devuelve SOLO JSON con este schema:",
          productionPromptSchema,
        ];

  return [
    system,
    "",
    ...rules,
    "",
    "TEMPLATE:",
    template,
    "",
    "INPUT JSON:",
    payload,
  ].join("\n");
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

function applyIdeaTemplate(
  template: string,
  schema: string,
  inputJson: string,
): string {
  const replaced = template
    .replaceAll("%schema%", schema)
    .replaceAll("%input%", inputJson)
    .replaceAll("%input_json%", inputJson);

  if (replaced === template) {
    return [template, "", "SCHEMA:", schema, "", "INPUT:", inputJson].join("\n");
  }

  return replaced;
}

function pickRandomOption(options: string[]): string | undefined {
  if (!options.length) return undefined;
  const index = Math.floor(Math.random() * options.length);
  return options[index];
}

function buildChatSelections(
  selections: Record<ListName, SelectionConfig>,
  listOrder: ListName[],
  lists: Lists,
): Partial<Record<ListName, ChatPromptSelection>> {
  const selectionPayload: Partial<Record<ListName, ChatPromptSelection>> = {};

  for (const name of listOrder) {
    const config = selections[name];
    if (!config || config.mode === "ignore") continue;

    if (config.mode === "manual") {
      const value = config.value.trim();
      if (value) selectionPayload[name] = { mode: "manual", value };
      continue;
    }

    if (config.mode === "random") {
      const randomValue = pickRandomOption(lists[name] ?? []);
      if (randomValue) {
        selectionPayload[name] = { mode: "manual", value: randomValue };
      }
      continue;
    }
  }

  return selectionPayload;
}

function buildApiSelections(
  selections: Record<ListName, SelectionConfig>,
  listOrder: ListName[],
): Partial<Record<ListName, { mode: SelectionMode; value?: string }>> {
  const selectionPayload: Partial<
    Record<ListName, { mode: SelectionMode; value?: string }>
  > = {};

  for (const name of listOrder) {
    const config = selections[name];
    if (!config || config.mode === "ignore") continue;

    if (config.mode === "manual") {
      const value = config.value.trim();
      if (value) selectionPayload[name] = { mode: "manual", value };
      continue;
    }

    if (config.mode === "random") {
      selectionPayload[name] = { mode: "random" };
      continue;
    }
  }

  return selectionPayload;
}

function buildChatPrompt(
  language: LanguageCode,
  elements: ElementsConfig,
  input: ChatPromptInput,
): string {
  const system = resolveIdeaSystemPrompt(elements, language);
  const template = resolveIdeaTemplate(elements, language);
  const inputJson = JSON.stringify(removeEmpty(input as Record<string, unknown>), null, 2);
  const body = applyIdeaTemplate(template, ideaResponseSchema, inputJson);
  return [system, "", body].join("\n");
}

const i18n = {
  es: {
    appName: "Idea Forge",
    subtitle:
      "Genera 3 ideas prometedoras y un prompt tecnico listo para construir.",
    language: "Idioma",
    template: "Nivel de plantilla",
    templateBasic: "Basica",
    templateAdvanced: "Avanzada",
    selections: "Combinador",
    mode: "Modo",
    manual: "Elegir",
    decide: "Decide tu",
    random: "Aleatorio",
    randomNote: "Aleatorio (elige uno al generar)",
    none: "Sin definir",
    addItem: "Agregar",
    extraNotes: "Notas extra (opcional)",
    constraints: "Restricciones (opcional)",
    time: "Tiempo disponible",
    effort: "Esfuerzo/capacidad",
    budget: "Presupuesto",
    generate: "Generar ideas",
    generatePrompt: "Generar prompt para chat",
    results: "Resultados",
    prompt: "Prompt tecnico",
    pros: "Pros",
    cons: "Contras",
    score: "Puntuacion",
    suggestedLanguage: "Lenguaje sugerido",
    loading: "Generando...",
    error: "No se pudo generar",
    llmSettings: "LLM",
    llmEnabled: "Usar LLM",
    llmProvider: "Proveedor",
    llmModel: "Modelo",
    llmBaseUrl: "Base URL (opcional)",
    llmApiKey: "API Key",
    llmApiKeyHint: "No se guarda. Se envia solo en la peticion.",
    llmDisabledHint: "Desactivado = genera un prompt para pegar en un chat con un LLM",
    providerDeepSeek: "DeepSeek",
    providerOpenAi: "OpenAI",
    selectIdeaHint: "Selecciona una idea para generar el prompt de produccion.",
    codexPrompt: "Prompt de produccion",
    codexGenerating: "Generando prompt de produccion...",
    codexEmpty:
      "Selecciona una idea o pega la respuesta del LLM para ver el prompt de produccion.",
    productionChatTitle: "Prompt para generar el prompt de produccion",
    productionChatHint:
      "Copia y pega esto en tu LLM. Debe devolver JSON con {\"prompt\":\"...\"}.",
    productionChatEmpty: "Selecciona una idea para generar el prompt.",
    productionImportTitle: "Pegar respuesta de prompt de produccion",
    productionImportHint:
      "Pega aqui el JSON devuelto por el LLM (sin markdown) para ver el prompt final.",
    productionImportPlaceholder: "Pega aqui la respuesta JSON del LLM...",
    productionImportLoad: "Cargar",
    productionImportClear: "Limpiar",
    productionImportInvalid:
      "JSON invalido o no sigue el schema. Asegurate de pegar SOLO el JSON del output.",
    chatPromptTitle: "Prompt para LLM (chat)",
    chatPromptHint:
      "Copia y pega este prompt en tu LLM. Pidele que devuelva solo JSON.",
    importJsonTitle: "Cargar respuesta JSON",
    importJsonHint:
      "Pega aqui el JSON devuelto por el LLM (sin markdown) para ver las ideas dentro de la app.",
    importJsonPlaceholder: "Pega aqui la respuesta JSON del LLM...",
    importJsonLoad: "Cargar",
    importJsonClear: "Limpiar",
    importJsonInvalid:
      "JSON invalido o no sigue el schema. Asegurate de pegar SOLO el JSON del output.",
    copy: "Copiar",
    copied: "Copiado",
    elementsTitle: "JSON de elementos",
    elementsHint:
      "Carga un JSON de elementos con categorias y opciones. Se guarda en tu navegador.",
    elementsPlaceholder: "Pega aqui el JSON de elementos...",
    elementsImport: "Cargar JSON",
    elementsExport: "Exportar JSON",
    elementsReset: "Restaurar default",
    elementsFile: "Importar archivo JSON",
    elementsInvalid:
      "JSON invalido o no cumple con el schema de elementos.",
    validation: "Validacion",
    inputsTitle: "Inputs",
    painFrequency: "Dolor y frecuencia",
    willingnessToPay: "Disposicion a pagar",
    alternatives: "Alternativas actuales",
    roiImpact: "ROI / impacto",
    adoptionFriction: "Friccion de adopcion",
    acquisition: "Adquisicion",
    retention: "Retencion",
    risks: "Riesgos",
  },
  en: {
    appName: "Idea Forge",
    subtitle:
      "Generate 3 promising ideas and a technical prompt ready to build.",
    language: "Language",
    template: "Template level",
    templateBasic: "Basic",
    templateAdvanced: "Advanced",
    selections: "Combiner",
    mode: "Mode",
    manual: "Choose",
    decide: "Decide",
    random: "Random",
    randomNote: "Random (picks one on generate)",
    none: "Undefined",
    addItem: "Add",
    extraNotes: "Extra notes (optional)",
    constraints: "Constraints (optional)",
    time: "Available time",
    effort: "Effort/capacity",
    budget: "Budget",
    generate: "Generate ideas",
    generatePrompt: "Generate chat prompt",
    results: "Results",
    prompt: "Technical prompt",
    pros: "Pros",
    cons: "Cons",
    score: "Score",
    suggestedLanguage: "Suggested language",
    loading: "Generating...",
    error: "Failed to generate",
    llmSettings: "LLM",
    llmEnabled: "Use LLM",
    llmProvider: "Provider",
    llmModel: "Model",
    llmBaseUrl: "Base URL (optional)",
    llmApiKey: "API Key",
    llmApiKeyHint: "Not saved. Sent only with the request.",
    llmDisabledHint: "Disabled = generates a prompt to paste into an LLM chat",
    providerDeepSeek: "DeepSeek",
    providerOpenAi: "OpenAI",
    selectIdeaHint: "Select an idea to generate the production prompt.",
    codexPrompt: "Production prompt",
    codexGenerating: "Generating production prompt...",
    codexEmpty:
      "Select an idea or paste the LLM response to view the production prompt.",
    productionChatTitle: "Prompt to generate the production prompt",
    productionChatHint:
      "Copy/paste this into your LLM. It must return JSON with {\"prompt\":\"...\"}.",
    productionChatEmpty: "Select an idea to generate the prompt.",
    productionImportTitle: "Paste production prompt response",
    productionImportHint:
      "Paste the JSON returned by the LLM (no markdown) to view the final prompt.",
    productionImportPlaceholder: "Paste the LLM JSON response here...",
    productionImportLoad: "Load",
    productionImportClear: "Clear",
    productionImportInvalid:
      "Invalid JSON or schema mismatch. Make sure you paste ONLY the JSON output.",
    chatPromptTitle: "Chat LLM prompt",
    chatPromptHint:
      "Copy/paste this into your LLM. Ask it to return JSON only.",
    importJsonTitle: "Load JSON response",
    importJsonHint:
      "Paste the JSON returned by the LLM (no markdown) to view the ideas inside the app.",
    importJsonPlaceholder: "Paste the LLM JSON response here...",
    importJsonLoad: "Load",
    importJsonClear: "Clear",
    importJsonInvalid:
      "Invalid JSON or schema mismatch. Make sure you paste ONLY the JSON output.",
    copy: "Copy",
    copied: "Copied",
    elementsTitle: "Elements JSON",
    elementsHint:
      "Load an elements JSON with categories and options. Stored in your browser.",
    elementsPlaceholder: "Paste the elements JSON here...",
    elementsImport: "Load JSON",
    elementsExport: "Export JSON",
    elementsReset: "Reset to default",
    elementsFile: "Import JSON file",
    elementsInvalid:
      "Invalid JSON or it doesn't match the elements schema.",
    validation: "Validation",
    inputsTitle: "Inputs",
    painFrequency: "Pain & frequency",
    willingnessToPay: "Willingness to pay",
    alternatives: "Current alternatives",
    roiImpact: "ROI / impact",
    adoptionFriction: "Adoption friction",
    acquisition: "Acquisition",
    retention: "Retention",
    risks: "Risks",
  },
} as const;

export default function App() {
  const [language, setLanguage] = useState<LanguageCode>("es");
  const [templateLevel, setTemplateLevel] = useState<"basic" | "advanced">(
    "basic",
  );
  const [elements, setElements] = useState<ElementsConfig>(() => defaultElements);
  const [elementsJson, setElementsJson] = useState("");
  const [elementsError, setElementsError] = useState<string | null>(null);
  const categoryKeys = useMemo(
    () => elements.categories.map((category) => category.key),
    [elements],
  );
  const categoryLookup = useMemo(
    () => new Map(elements.categories.map((category) => [category.key, category])),
    [elements],
  );
  const listOrder = categoryKeys;
  const categoriesByKey = useMemo(() => {
    const map: Record<string, ElementCategory> = {};
    for (const category of elements.categories) {
      map[category.key] = category;
    }
    return map;
  }, [elements]);
  const lists = useMemo(() => {
    const map: Lists = {};
    for (const category of elements.categories) {
      map[category.key] = Object.keys(category.options ?? {});
    }
    return map;
  }, [elements]);
  const [selections, setSelections] = useState<
    Record<ListName, SelectionConfig>
  >(() => buildSelectionState(categoryKeys));
  const [newItems, setNewItems] = useState<Record<ListName, string>>(() =>
    buildTextState(categoryKeys),
  );
  const [extraNotes, setExtraNotes] = useState("");
  const [constraints, setConstraints] = useState<Constraints>({
    time: "",
    effort: "",
    budget: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IdeaResponse | null>(null);
  const [chatPrompt, setChatPrompt] = useState("");
  const [chatPromptCopied, setChatPromptCopied] = useState(false);
  const [importJson, setImportJson] = useState("");
  const [importJsonError, setImportJsonError] = useState<string | null>(null);
  const [productionChatPrompt, setProductionChatPrompt] = useState("");
  const [productionChatPromptCopied, setProductionChatPromptCopied] =
    useState(false);
  const [productionImportJson, setProductionImportJson] = useState("");
  const [productionImportError, setProductionImportError] = useState<string | null>(
    null,
  );
  const [llmEnabled, setLlmEnabled] = useState(false);
  const [llmProvider, setLlmProvider] = useState<LlmProvider>("deepseek");
  const [llmModel, setLlmModel] = useState("");
  const [llmBaseUrl, setLlmBaseUrl] = useState("");
  const [llmApiKey, setLlmApiKey] = useState("");
  const [selectedIdeaIndex, setSelectedIdeaIndex] = useState<number | null>(null);
  const [codexPrompt, setCodexPrompt] = useState("");
  const [codexLoading, setCodexLoading] = useState(false);
  const [codexError, setCodexError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const t = i18n[language];
  const resultsHint = result ? t.selectIdeaHint : chatPrompt ? t.chatPromptHint : t.subtitle;

  useEffect(() => {
    const raw = localStorage.getItem(ELEMENTS_STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = safeParseJson(raw);
      if (isElementsConfig(parsed)) {
        const normalized = normalizeElementsConfig(parsed);
        setElements(normalized);
        setElementsJson(JSON.stringify(normalized, null, 2));
      } else {
        localStorage.removeItem(ELEMENTS_STORAGE_KEY);
      }
    } catch {
      localStorage.removeItem(ELEMENTS_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    setSelections((prev) => buildSelectionState(categoryKeys, prev));
    setNewItems((prev) => buildTextState(categoryKeys, prev));
  }, [categoryKeys.join("|")]);

  useEffect(() => {
    localStorage.setItem(ELEMENTS_STORAGE_KEY, JSON.stringify(elements, null, 2));
  }, [elements]);

  const handleModeChange = (name: ListName, mode: SelectionMode) => {
    setSelections((prev) => ({
      ...prev,
      [name]: {
        mode,
        value: mode === "manual" ? (prev[name]?.value ?? "") : "",
      },
    }));
  };

  const handleValueChange = (name: ListName, value: string) => {
    setSelections((prev) => ({
      ...prev,
      [name]: {
        ...(prev[name] ?? { mode: "manual", value: "" }),
        value,
      },
    }));
  };

  const addListItem = (name: ListName) => {
    const value = (newItems[name] ?? "").trim();
    if (!value) return;
    setElements((prev) => {
      const categories = prev.categories.map((category) => {
        if (category.key !== name) return category;
        const exists = Object.keys(category.options).some(
          (item) => item.toLowerCase() === value.toLowerCase(),
        );
        if (exists) return category;
        return {
          ...category,
          options: {
            ...category.options,
            [value]: { es: "", en: "" },
          },
        };
      });
      return { ...prev, categories };
    });
    setNewItems((prev) => ({ ...prev, [name]: "" }));
  };

  const handleImportElements = () => {
    const raw = elementsJson.trim();
    if (!raw) return;
    try {
      const parsed = safeParseJson(raw);
      if (!isElementsConfig(parsed)) {
        throw new Error(t.elementsInvalid);
      }
      const normalized = normalizeElementsConfig(parsed);
      setElements(normalized);
      setElementsError(null);
    } catch (err) {
      const message = (err as Error).message || t.elementsInvalid;
      setElementsError(message);
    }
  };

  const handleExportElements = () => {
    setElementsJson(JSON.stringify(elements, null, 2));
    setElementsError(null);
  };

  const handleResetElements = () => {
    setElements(defaultElements);
    setElementsJson(JSON.stringify(defaultElements, null, 2));
    setElementsError(null);
    localStorage.removeItem(ELEMENTS_STORAGE_KEY);
  };

  const handleElementsFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      setElementsJson(text);
      setElementsError(null);
    } catch {
      setElementsError(t.elementsInvalid);
    }
  };

  const canGenerate = useMemo(() => {
    return listOrder.every((name) => {
      const config = selections[name] ?? { mode: "decide", value: "" };
      if (config.mode === "manual") {
        return config.value.trim().length > 0;
      }
      return true;
    });
  }, [selections]);

  const resetCodexPrompt = () => {
    setSelectedIdeaIndex(null);
    setCodexPrompt("");
    setCodexError(null);
    setCopied(false);
    setProductionChatPrompt("");
    setProductionChatPromptCopied(false);
    setProductionImportJson("");
    setProductionImportError(null);
  };

  const buildHeaders = () => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const apiKey = llmApiKey.trim();
    if (llmEnabled && apiKey) {
      headers["x-llm-api-key"] = apiKey;
    }

    return headers;
  };

  const generateIdeas = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setChatPrompt("");
    setChatPromptCopied(false);
    setImportJson("");
    setImportJsonError(null);
    resetCodexPrompt();

    try {
      const trimmedExtraNotes = extraNotes.trim();

      const constraintsPayload = {
        time: constraints.time.trim() || undefined,
        effort: constraints.effort.trim() || undefined,
        budget: constraints.budget.trim() || undefined,
      };

      const selectionsPayload = buildApiSelections(selections, listOrder);

      const payload = {
        language,
        templateLevel,
        selections: selectionsPayload,
        elements,
        extraNotes: trimmedExtraNotes || undefined,
        constraints: constraintsPayload,
        llm: {
          enabled: llmEnabled,
          provider: llmProvider,
          model: llmModel.trim() || undefined,
          baseUrl: llmBaseUrl.trim() || undefined,
        },
      };

      if (!llmEnabled) {
        const chatSelections = buildChatSelections(
          selections,
          listOrder,
          lists,
        );

        const chatInput: ChatPromptInput = {
          language,
          templateLevel,
          extraNotes: trimmedExtraNotes || undefined,
          constraints: constraintsPayload,
          selections: chatSelections,
        };

        setChatPrompt(buildChatPrompt(language, elements, chatInput));
        return;
      }

      const response = await fetch("/api/v1/ideas", {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(t.error);
      }

      const data = (await response.json()) as IdeaResponse;
      setResult(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadImportedJson = () => {
    const raw = importJson.trim();
    if (!raw) return;

    try {
      const parsed = safeParseJson(raw);
      if (!isIdeaResponse(parsed)) {
        throw new Error(t.importJsonInvalid);
      }
      setImportJsonError(null);
      setError(null);
      setResult(parsed);
      resetCodexPrompt();
    } catch (err) {
      const message = (err as Error).message || t.importJsonInvalid;
      setImportJsonError(message);
    }
  };

  const handleClearImportedJson = () => {
    setImportJson("");
    setImportJsonError(null);
  };

  const handleSelectIdea = async (idea: Idea, index: number) => {
    setSelectedIdeaIndex(index);
    setCodexError(null);
    setCodexPrompt("");
    setCopied(false);
    setCodexLoading(false);
    setProductionImportJson("");
    setProductionImportError(null);
    setProductionChatPromptCopied(false);

    const constraintsPayload = {
      time: constraints.time.trim() || undefined,
      effort: constraints.effort.trim() || undefined,
      budget: constraints.budget.trim() || undefined,
    };

    if (!llmEnabled) {
      const template = resolveProductionTemplate(elements, language);
      const payload = buildProductionPayload({
        language,
        templateLevel,
        idea,
        ideaPrompt: result?.prompt,
        elements,
        extraNotes: extraNotes.trim() || undefined,
        constraints: constraintsPayload,
      });
      setProductionChatPrompt(
        buildProductionChatPrompt(language, template, payload, elements),
      );
      setCodexLoading(false);
      return;
    }

    setProductionChatPrompt("");
    setCodexLoading(true);

    try {
      const payload = {
        language,
        templateLevel,
        idea,
        ideaPrompt: result?.prompt,
        elements,
        extraNotes: extraNotes.trim() || undefined,
        constraints: constraintsPayload,
        llm: {
          enabled: llmEnabled,
          provider: llmProvider,
          model: llmModel.trim() || undefined,
          baseUrl: llmBaseUrl.trim() || undefined,
        },
      };

      const response = await fetch("/api/v1/codex-prompt", {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(t.error);
      }

      const data = (await response.json()) as CodexPromptResponse;
      setCodexPrompt(data.prompt ?? "");
    } catch (err) {
      setCodexError((err as Error).message);
    } finally {
      setCodexLoading(false);
    }
  };

  const handleCopyChatPrompt = async () => {
    if (!chatPrompt) return;
    try {
      await navigator.clipboard.writeText(chatPrompt);
      setChatPromptCopied(true);
      setTimeout(() => setChatPromptCopied(false), 1500);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyProductionChatPrompt = async () => {
    if (!productionChatPrompt) return;
    try {
      await navigator.clipboard.writeText(productionChatPrompt);
      setProductionChatPromptCopied(true);
      setTimeout(() => setProductionChatPromptCopied(false), 1500);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLoadProductionJson = () => {
    const raw = productionImportJson.trim();
    if (!raw) return;

    try {
      const parsed = safeParseJson(raw);
      if (!isProductionPromptResponse(parsed)) {
        throw new Error(t.productionImportInvalid);
      }
      setProductionImportError(null);
      setCodexError(null);
      setCodexPrompt(parsed.prompt);
    } catch (err) {
      const message = (err as Error).message || t.productionImportInvalid;
      setProductionImportError(message);
    }
  };

  const handleClearProductionJson = () => {
    setProductionImportJson("");
    setProductionImportError(null);
  };

  const handleCopy = async () => {
    if (!codexPrompt) return;
    try {
      await navigator.clipboard.writeText(codexPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="page">
      <header className="hero">
        <div>
          <p className="pill">AI-Ready Ideation</p>
          <h1>{t.appName}</h1>
          <p className="subtitle">{t.subtitle}</p>
        </div>
        <div className="language-toggle">
          <label>{t.language}</label>
          <div className="toggle">
            <button
              className={language === "es" ? "active" : ""}
              onClick={() => setLanguage("es")}
              type="button"
            >
              Espanol
            </button>
            <button
              className={language === "en" ? "active" : ""}
              onClick={() => setLanguage("en")}
              type="button"
            >
              English
            </button>
          </div>
        </div>
      </header>

      <main className="layout">
        <section className="panel">
          <div className="panel-header">
            <h2>{t.selections}</h2>
            <div className="template-select">
              <label>{t.template}</label>
              <select
                value={templateLevel}
                onChange={(event) =>
                  setTemplateLevel(event.target.value as "basic" | "advanced")
                }
              >
                <option value="basic">{t.templateBasic}</option>
                <option value="advanced">{t.templateAdvanced}</option>
              </select>
            </div>
          </div>

          <div className="grid">
            {listOrder.map((name) => {
              const category = categoriesByKey[name];
              const label =
                getLocalizedText(category?.label, language) ??
                formatKeyLabel(name);
              const hint = getLocalizedText(category?.hint, language) ?? "";
              const options = lists[name] ?? [];
              const selection = selections[name] ?? { mode: "decide", value: "" };
              const newItemValue = newItems[name] ?? "";

              return (
                <div className="field" key={name}>
                  <div className="field-title">
                    <div>
                      <strong>{label}</strong>
                      <span>{hint}</span>
                    </div>
                    <div className="mode">
                      <label>{t.mode}</label>
                      <select
                        value={selection.mode}
                        onChange={(event) =>
                          handleModeChange(
                            name,
                            event.target.value as SelectionMode,
                          )
                        }
                      >
                        <option value="manual">{t.manual}</option>
                        <option value="decide">{t.decide}</option>
                        <option value="random">{t.random}</option>
                        <option value="ignore">{t.none}</option>
                      </select>
                    </div>
                  </div>

                  {selection.mode === "manual" ? (
                    <>
                      <select
                        className="value-select"
                        value={selection.value}
                        onChange={(event) =>
                          handleValueChange(name, event.target.value)
                        }
                      >
                        <option value="">--</option>
                        {options.map((item) => (
                          <option key={item} value={item}>
                            {formatOptionLabel(item)}
                          </option>
                        ))}
                      </select>
                      {(() => {
                        const selected = selection.value;
                        if (!selected) return null;
                        const description = getLocalizedText(
                          category?.options?.[selected],
                          language,
                        );
                        return description ? (
                          <div className="option-description">{description}</div>
                        ) : null;
                      })()}
                    </>
                  ) : (
                    <div className="mode-note">
                      {selection.mode === "decide"
                        ? t.decide
                        : selection.mode === "random"
                          ? t.randomNote
                          : t.none}
                    </div>
                  )}

                  <div className="adder">
                    <input
                      placeholder={t.addItem}
                      value={newItemValue}
                      onChange={(event) =>
                        setNewItems((prev) => ({
                          ...prev,
                          [name]: event.target.value,
                        }))
                      }
                    />
                    <button type="button" onClick={() => addListItem(name)}>
                      {t.addItem}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="panel-actions">
            <div className="llm-panel">
              <div className="llm-header">
                <h3>{t.llmSettings}</h3>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={llmEnabled}
                    onChange={(event) => setLlmEnabled(event.target.checked)}
                  />
                  <span>{t.llmEnabled}</span>
                </label>
              </div>
              <p className="hint">{t.llmDisabledHint}</p>
              <div className="llm-grid">
                <div>
                  <label>{t.llmProvider}</label>
                  <select
                    value={llmProvider}
                    onChange={(event) =>
                      setLlmProvider(event.target.value as LlmProvider)
                    }
                    disabled={!llmEnabled}
                  >
                    <option value="deepseek">{t.providerDeepSeek}</option>
                    <option value="openai">{t.providerOpenAi}</option>
                  </select>
                </div>
                <div>
                  <label>{t.llmModel}</label>
                  <input
                    value={llmModel}
                    onChange={(event) => setLlmModel(event.target.value)}
                    placeholder="deepseek-chat / gpt-4o-mini"
                    disabled={!llmEnabled}
                  />
                </div>
                <div>
                  <label>{t.llmBaseUrl}</label>
                  <input
                    value={llmBaseUrl}
                    onChange={(event) => setLlmBaseUrl(event.target.value)}
                    placeholder="https://api..."
                    disabled={!llmEnabled}
                  />
                </div>
                <div>
                  <label>{t.llmApiKey}</label>
                  <input
                    type="password"
                    value={llmApiKey}
                    onChange={(event) => setLlmApiKey(event.target.value)}
                    placeholder="..."
                    disabled={!llmEnabled}
                  />
                  <span className="hint">{t.llmApiKeyHint}</span>
                </div>
              </div>
            </div>

            <div className="constraints">
              <h3>{t.constraints}</h3>
              <div className="constraints-grid">
                <div>
                  <label>{t.time}</label>
                  <input
                    value={constraints.time}
                    onChange={(event) =>
                      setConstraints((prev) => ({
                        ...prev,
                        time: event.target.value,
                      }))
                    }
                    placeholder="2-4 semanas"
                  />
                </div>
                <div>
                  <label>{t.effort}</label>
                  <input
                    value={constraints.effort}
                    onChange={(event) =>
                      setConstraints((prev) => ({
                        ...prev,
                        effort: event.target.value,
                      }))
                    }
                    placeholder="1 persona, 10h/semana"
                  />
                </div>
                <div>
                  <label>{t.budget}</label>
                  <input
                    value={constraints.budget}
                    onChange={(event) =>
                      setConstraints((prev) => ({
                        ...prev,
                        budget: event.target.value,
                      }))
                    }
                    placeholder="< 500 USD"
                  />
                </div>
              </div>
            </div>

            <textarea
              placeholder={t.extraNotes}
              value={extraNotes}
              onChange={(event) => setExtraNotes(event.target.value)}
            />
            <div className="actions-row">
              <button
                type="button"
                className="primary"
                onClick={generateIdeas}
                disabled={!canGenerate || loading}
              >
                {loading ? t.loading : llmEnabled ? t.generate : t.generatePrompt}
              </button>
            </div>
            {error ? <div className="error">{error}</div> : null}
          </div>
        </section>

        <section className="panel elements-panel">
          <div className="panel-header">
            <div>
              <h2>{t.elementsTitle}</h2>
              <p className="hint">{t.elementsHint}</p>
            </div>
          </div>
          <div className="elements-body">
            <label className="file-input">
              <span>{t.elementsFile}</span>
              <input
                type="file"
                accept="application/json"
                onChange={handleElementsFile}
              />
            </label>
            <textarea
              placeholder={t.elementsPlaceholder}
              value={elementsJson}
              onChange={(event) => setElementsJson(event.target.value)}
            />
            {elementsError ? <div className="error">{elementsError}</div> : null}
            <div className="button-row">
              <button
                type="button"
                className="ghost"
                onClick={handleImportElements}
                disabled={!elementsJson.trim()}
              >
                {t.elementsImport}
              </button>
              <button type="button" className="ghost" onClick={handleExportElements}>
                {t.elementsExport}
              </button>
              <button type="button" className="ghost" onClick={handleResetElements}>
                {t.elementsReset}
              </button>
            </div>
          </div>
        </section>

        <section className="panel results">
          <div className="panel-header">
            <div>
              <h2>{t.results}</h2>
              <p className="hint">{resultsHint}</p>
            </div>
            {result?.suggestedLanguage ? (
              <div className="badge">
                {t.suggestedLanguage}: {result.suggestedLanguage}
              </div>
            ) : null}
          </div>

          {!result ? (
            <>
              {chatPrompt ? (
                <div className="codex">
                  <div className="codex-header">
                    <h3>{t.chatPromptTitle}</h3>
                    <button
                      type="button"
                      className="ghost"
                      onClick={handleCopyChatPrompt}
                      disabled={!chatPrompt}
                    >
                      {chatPromptCopied ? t.copied : t.copy}
                    </button>
                  </div>
                  <p className="hint">{t.chatPromptHint}</p>
                  <pre>{chatPrompt}</pre>
                </div>
              ) : (
                <div className="empty">
                  {loading ? (
                    <div className="loading">
                      <div className="spinner" />
                      <span>{t.loading}</span>
                    </div>
                  ) : (
                    t.subtitle
                  )}
                </div>
              )}

              {!llmEnabled ? (
                <div className="codex">
                  <div className="codex-header">
                    <h3>{t.importJsonTitle}</h3>
                    <div className="button-row">
                      <button
                        type="button"
                        className="ghost"
                        onClick={handleLoadImportedJson}
                        disabled={!importJson.trim()}
                      >
                        {t.importJsonLoad}
                      </button>
                      <button
                        type="button"
                        className="ghost"
                        onClick={handleClearImportedJson}
                        disabled={!importJson.trim() && !importJsonError}
                      >
                        {t.importJsonClear}
                      </button>
                    </div>
                  </div>
                  <p className="hint">{t.importJsonHint}</p>
                  {importJsonError ? (
                    <div className="error">{importJsonError}</div>
                  ) : null}
                  <textarea
                    placeholder={t.importJsonPlaceholder}
                    value={importJson}
                    onChange={(event) => setImportJson(event.target.value)}
                  />
                </div>
              ) : null}
            </>
          ) : (
            <div className="results-body">
              <div className="ideas">
                {result.ideas.map((idea, index) => {
                  const inputEntries = Object.entries(idea.inputs ?? {});

                  return (
                    <article
                      className={`idea-card ${
                        selectedIdeaIndex === index ? "selected" : ""
                      }`}
                      key={`${idea.title}-${index}`}
                      onClick={() => handleSelectIdea(idea, index)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          handleSelectIdea(idea, index);
                        }
                      }}
                    >
                      <div className="idea-head">
                        <h3>{idea.title}</h3>
                        <span className="score">
                          {t.score}: {idea.score.value}
                        </span>
                      </div>
                      <p className="one-liner">{idea.oneLiner}</p>
                      <p className="detail">{idea.solution}</p>
                      <p className="detail">{idea.differentiator}</p>
                      <div className="mvp">
                        <strong>MVP</strong>
                        <ul>
                          {idea.mvp.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                      {inputEntries.length > 0 ? (
                        <div className="inputs">
                          <strong>{t.inputsTitle}</strong>
                          <ul>
                            {inputEntries.map(([key, value]) => {
                              const category = categoryLookup.get(key);
                              const label =
                                getLocalizedText(category?.label, language) ??
                                formatKeyLabel(key);
                              const hint = getLocalizedText(category?.hint, language);
                              const description = category?.options?.[value]
                                ? getLocalizedText(
                                    category.options[value],
                                    language,
                                  )
                                : undefined;

                              return (
                                <li key={`${key}-${value}`}>
                                  <div className="input-head">
                                    <span className="input-label">{label}</span>
                                    {hint ? (
                                      <span className="input-hint">{hint}</span>
                                    ) : null}
                                  </div>
                                  <div className="input-value">
                                    {formatOptionLabel(value)}
                                  </div>
                                  {description ? (
                                    <p className="detail">{description}</p>
                                  ) : null}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      ) : null}
                      <div className="lists">
                        <div>
                          <strong>{t.pros}</strong>
                          <ul>
                            {idea.pros.map((pro) => (
                              <li key={pro}>{pro}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <strong>{t.cons}</strong>
                          <ul>
                            {idea.cons.map((con) => (
                              <li key={con}>{con}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <div className="validation">
                        <strong>{t.validation}</strong>
                        <div>
                          <span>{t.painFrequency}</span>
                          <p>{idea.painFrequency}</p>
                        </div>
                        <div>
                          <span>{t.willingnessToPay}</span>
                          <p>{idea.willingnessToPay}</p>
                        </div>
                        <div>
                          <span>{t.alternatives}</span>
                          <p>{idea.alternatives}</p>
                        </div>
                        <div>
                          <span>{t.roiImpact}</span>
                          <p>{idea.roiImpact}</p>
                        </div>
                        <div>
                          <span>{t.adoptionFriction}</span>
                          <p>{idea.adoptionFriction}</p>
                        </div>
                        <div>
                          <span>{t.acquisition}</span>
                          <p>{idea.acquisition}</p>
                        </div>
                        <div>
                          <span>{t.retention}</span>
                          <p>{idea.retention}</p>
                        </div>
                        <div>
                          <span>{t.risks}</span>
                          <p>{idea.risks}</p>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className="prompt">
                <h3>{t.prompt}</h3>
                <p>{result.prompt.intro}</p>
                <pre>{result.prompt.technical}</pre>
              </div>

              {!llmEnabled && selectedIdeaIndex !== null ? (
                <div className="codex">
                  <div className="codex-header">
                    <h3>{t.productionChatTitle}</h3>
                    <button
                      type="button"
                      className="ghost"
                      onClick={handleCopyProductionChatPrompt}
                      disabled={!productionChatPrompt}
                    >
                      {productionChatPromptCopied ? t.copied : t.copy}
                    </button>
                  </div>
                  <p className="hint">{t.productionChatHint}</p>
                  {productionChatPrompt ? (
                    <pre>{productionChatPrompt}</pre>
                  ) : (
                    <p className="hint">{t.productionChatEmpty}</p>
                  )}
                </div>
              ) : null}

              {!llmEnabled && selectedIdeaIndex !== null ? (
                <div className="codex">
                  <div className="codex-header">
                    <h3>{t.productionImportTitle}</h3>
                    <div className="button-row">
                      <button
                        type="button"
                        className="ghost"
                        onClick={handleLoadProductionJson}
                        disabled={!productionImportJson.trim()}
                      >
                        {t.productionImportLoad}
                      </button>
                      <button
                        type="button"
                        className="ghost"
                        onClick={handleClearProductionJson}
                        disabled={!productionImportJson.trim() && !productionImportError}
                      >
                        {t.productionImportClear}
                      </button>
                    </div>
                  </div>
                  <p className="hint">{t.productionImportHint}</p>
                  {productionImportError ? (
                    <div className="error">{productionImportError}</div>
                  ) : null}
                  <textarea
                    placeholder={t.productionImportPlaceholder}
                    value={productionImportJson}
                    onChange={(event) => setProductionImportJson(event.target.value)}
                  />
                </div>
              ) : null}

              <div className="codex">
                <div className="codex-header">
                  <h3>{t.codexPrompt}</h3>
                  <button
                    type="button"
                    className="ghost"
                    onClick={handleCopy}
                    disabled={!codexPrompt}
                  >
                    {copied ? t.copied : t.copy}
                  </button>
                </div>
                {codexLoading ? (
                  <div className="loading">
                    <div className="spinner" />
                    <span>{t.codexGenerating}</span>
                  </div>
                ) : codexError ? (
                  <div className="error">{codexError}</div>
                ) : codexPrompt ? (
                  <pre>{codexPrompt}</pre>
                ) : (
                  <p className="hint">{t.codexEmpty}</p>
                )}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
