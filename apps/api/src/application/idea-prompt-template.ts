import type { ElementsConfig, LocalizedText, PromptTemplate } from "../domain/models.js";

type Language = "es" | "en";

export type IdeaPromptInput = {
  language: string;
  templateLevel: string;
  architecture?: string;
  elements?: ElementsConfig;
  extraNotes?: string;
  constraints?: {
    time?: string;
    effort?: string;
    budget?: string;
  };
  selections: Record<string, { mode: "manual"; value: string } | { mode: "decide" }>;
};

const IDEA_SCHEMA = `{
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

const DEFAULT_IDEA_SYSTEM_PROMPT: Record<Language, string> = {
  en: "Return ONLY valid JSON. No markdown, no code fences, no commentary.",
  es: "Devuelve SOLO JSON valido. Sin markdown, sin bloques de codigo, sin comentarios.",
};

const DEFAULT_IDEA_PROMPT: Record<Language, string> = {
  en: [
    "TASK:",
    "Generate 3 app ideas AND a technical prompt ready to paste into a coding agent (Codex).",
    "",
    "RULES:",
    "- Output JSON only, matching the schema exactly.",
    "- Use input.language for all text.",
    "- Consider constraints (time/effort/budget) if provided.",
    "- Goal: make prompt.technical drive simple, Clean Code with minimal dependencies, no over-engineering, and easy-to-read code.",
    "- Selections: input.selections may omit keys.",
    "  - If a selection is present with mode=manual: use selection.value as is.",
    "  - If a selection is present with mode=decide: choose the best value yourself (do not ask the user).",
    "  - If a selection is missing: treat it as unconstrained and choose the best value.",
    "- For each idea, include an inputs object with the chosen values for the provided selection keys.",
    "- Elements: if input.elements is provided, use its categories/options.",
    "  - For each selection key, if input.elements has options for that key, choose one of those option keys.",
    "- Architecture:",
    "  - If input.architecture is missing/empty: do NOT mention architecture.",
    "  - If input.architecture == \"__llm_best__\": choose the best architecture and justify briefly.",
    "    Put the chosen architecture + rationale at the top of prompt.technical (1-3 lines).",
    "  - Otherwise: follow input.architecture (treat it as a key/name) and align the prompt.technical accordingly.",
    "- Generate exactly 3 ideas.",
    "- Each idea must include the validation fields: painFrequency, willingnessToPay, alternatives, roiImpact, adoptionFriction, acquisition, retention, risks.",
    "- If you use selection values in output text, convert underscores/hyphens to spaces for readability.",
    "- The prompt.technical must include: recommended stack (language/framework), Clean Code guidance, practical folder structure, endpoints, data models, validations, minimal tests, and a short README outline.",
    "",
    "SCHEMA:",
    "%schema%",
    "",
    "INPUT:",
    "%input%",
  ].join("\n"),
  es: [
    "TAREA:",
    "Genera 3 ideas de apps Y un prompt tecnico listo para pegar en un agente de codigo (Codex).",
    "",
    "REGLAS:",
    "- Devuelve SOLO JSON, siguiendo el schema exactamente.",
    "- Usa input.language para TODO el texto.",
    "- Considera restricciones (time/effort/budget) si existen.",
    "- Objetivo: que prompt.technical empuje a codigo simple con Clean Code, minimas dependencias, sin sobreingenieria y facil de leer.",
    "- Selecciones: input.selections puede omitir keys.",
    "  - Si hay una seleccion con mode=manual: usa selection.value tal cual.",
    "  - Si hay una seleccion con mode=decide: elige tu el mejor valor (no preguntes al usuario).",
    "  - Si falta una seleccion: sin restriccion; elige el mejor valor.",
    "- Para cada idea, incluye un objeto inputs con los valores elegidos para las keys de selecciones.",
    "- Elementos: si input.elements existe, usa sus categorias/opciones.",
    "  - Para cada key de seleccion, si hay opciones en input.elements, elige una de esas opciones.",
    "- Arquitectura:",
    "  - Si input.architecture no existe/vacio: NO menciones arquitectura.",
    "  - Si input.architecture == \"__llm_best__\": elige la mejor y justificaa brevemente.",
    "    Pon la arquitectura elegida + razon al inicio de prompt.technical (1-3 lineas).",
    "  - Si no: sigue input.architecture (tratalo como key/nombre) y alinea prompt.technical.",
    "- Genera exactamente 3 ideas.",
    "- Cada idea debe incluir los campos de validacion: painFrequency, willingnessToPay, alternatives, roiImpact, adoptionFriction, acquisition, retention, risks.",
    "- Si usas valores con underscores/guiones en el texto, conviertelos a espacios para legibilidad.",
    "- El prompt.technical debe incluir: stack recomendado (lenguaje/framework), guia de Clean Code, estructura practica (carpetas), endpoints, modelos de datos, validaciones, tests minimos y un esquema corto de README.",
    "",
    "SCHEMA:",
    "%schema%",
    "",
    "INPUT:",
    "%input%",
  ].join("\n"),
};

export function buildIdeaPromptMessages(input: IdeaPromptInput) {
  const language: Language = input.language === "en" ? "en" : "es";
  const system = resolveIdeaSystemPrompt(input.elements, language);
  const template = resolveIdeaTemplate(input.elements, language);
  const payload = JSON.stringify(input, null, 2);
  const user = applyIdeaTemplate(template, IDEA_SCHEMA, payload);
  return { system, user };
}

function resolveIdeaTemplate(
  elements: ElementsConfig | undefined,
  language: Language,
): string {
  const anyElements = elements as
    | (ElementsConfig & { idea_prompt?: PromptTemplate })
    | undefined;
  const rawTemplate = anyElements?.ideaPrompt ?? anyElements?.idea_prompt;
  const resolved = resolveTemplateValue(rawTemplate, language);
  return resolved ?? DEFAULT_IDEA_PROMPT[language];
}

function resolveIdeaSystemPrompt(
  elements: ElementsConfig | undefined,
  language: Language,
): string {
  const anyElements = elements as
    | (ElementsConfig & { idea_system_prompt?: PromptTemplate })
    | undefined;
  const rawSystem =
    anyElements?.ideaSystemPrompt ?? anyElements?.idea_system_prompt;
  const resolved = resolveTemplateValue(rawSystem, language);
  return resolved ?? DEFAULT_IDEA_SYSTEM_PROMPT[language];
}

function resolveTemplateValue(
  value: PromptTemplate | undefined,
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
