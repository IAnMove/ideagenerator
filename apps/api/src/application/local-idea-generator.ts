import type {
  Idea,
  IdeaRequest,
  IdeaResponse,
  ResolvedSelections,
} from "../domain/models.js";
import type { IdeaGenerator, LlmOptions } from "./ports.js";

const angles = {
  es: [
    "enfoque en automatizacion",
    "experiencia mobile-first",
    "analitica accionable",
    "workflow colaborativo",
    "onboarding ultra rapido",
  ],
  en: [
    "automation-first",
    "mobile-first experience",
    "actionable analytics",
    "collaborative workflow",
    "fast onboarding",
  ],
} as const;

const mvpFeatures = {
  es: [
    "panel principal con metricas clave",
    "configuracion guiada",
    "alertas inteligentes",
    "plantillas rapidas",
    "exportacion de reportes",
    "integracion basica",
  ],
  en: [
    "dashboard with key metrics",
    "guided setup",
    "smart alerts",
    "quick templates",
    "report export",
    "basic integration",
  ],
} as const;

const prosPool = {
  es: [
    "dolor claro y frecuente",
    "audiencia bien definida",
    "mvp viable en pocas semanas",
    "canal de adquisicion directo",
    "valor percibido alto",
  ],
  en: [
    "clear and frequent pain",
    "well-defined audience",
    "mvp viable in a few weeks",
    "direct acquisition channel",
    "high perceived value",
  ],
} as const;

const consPool = {
  es: [
    "competencia activa en el mercado",
    "necesita validacion temprana",
    "posible friccion en onboarding",
    "riesgo de baja retencion",
    "dependencia de integraciones",
  ],
  en: [
    "active competition in the market",
    "needs early validation",
    "possible onboarding friction",
    "risk of low retention",
    "dependency on integrations",
  ],
} as const;

const scoreReasonsPool = {
  es: [
    "problema recurrente",
    "impacto directo en productividad",
    "canal de entrada claro",
    "diferenciador simple",
  ],
  en: [
    "recurring problem",
    "direct productivity impact",
    "clear acquisition channel",
    "simple differentiator",
  ],
} as const;

const validationPool = {
  es: {
    painFrequency: [
      "dolor alto y recurrente (semanal)",
      "dolor medio pero frecuente",
      "dolor alto y diario",
    ],
    willingnessToPay: [
      "paga el responsable del area con presupuesto",
      "ticket medio mensual viable",
      "pago anual con descuento",
    ],
    alternatives: [
      "hoy lo hacen con Excel y correo",
      "usan herramientas generalistas",
      "no hay solucion clara",
    ],
    roiImpact: [
      "ahorra tiempo operativo semanal",
      "reduce costos directos",
      "mejora tasa de conversion",
    ],
    adoptionFriction: [
      "onboarding guiado en 10 minutos",
      "requiere integracion basica",
      "cambio moderado de proceso",
    ],
    acquisition: [
      "canal directo via comunidades",
      "contenido + SEO en nicho",
      "partnerships con herramientas adyacentes",
    ],
    retention: [
      "uso recurrente por flujo semanal",
      "alertas y reportes generan regreso",
      "mvp con habitos de uso diario",
    ],
    risks: [
      "dependencia de integraciones externas",
      "riesgo de adopcion inicial baja",
      "competencia con players establecidos",
    ],
  },
  en: {
    painFrequency: [
      "high and recurring pain (weekly)",
      "medium pain but frequent",
      "high and daily pain",
    ],
    willingnessToPay: [
      "paid by team lead with budget",
      "viable mid monthly ticket",
      "annual payment with discount",
    ],
    alternatives: [
      "handled with spreadsheets and email",
      "using generic tools",
      "no clear solution today",
    ],
    roiImpact: [
      "saves weekly operational time",
      "reduces direct costs",
      "improves conversion rate",
    ],
    adoptionFriction: [
      "guided onboarding in 10 minutes",
      "requires basic integration",
      "moderate process change",
    ],
    acquisition: [
      "direct channel via communities",
      "content + SEO in niche",
      "partnerships with adjacent tools",
    ],
    retention: [
      "recurring weekly workflow",
      "alerts and reports drive return",
      "daily habit loop",
    ],
    risks: [
      "dependency on external integrations",
      "risk of low early adoption",
      "competition with established players",
    ],
  },
} as const;

const templates = {
  es: {
    title: (s: ResolvedSelections) =>
      `${capitalize(s.productType)} para ${s.audience} en ${s.sector}`,
    oneLiner: (s: ResolvedSelections) =>
      `${capitalize(s.productType)} que ayuda a ${s.audience} a mejorar ${s.problem} con enfoque en ${s.channel}.`,
    solution: (s: ResolvedSelections) =>
      `Centraliza ${s.problem} en un solo flujo con automatizaciones y seguimiento en tiempo real.`,
    intro: (s: ResolvedSelections) =>
      `Aplicacion para ${s.audience} en el sector ${s.sector} que resuelve ${s.problem}. Se distribuye via ${s.channel} y prioriza un MVP rapido.`,
    technicalHeader: "Prompt tecnico:",
  },
  en: {
    title: (s: ResolvedSelections) =>
      `${capitalize(s.productType)} for ${s.audience} in ${s.sector}`,
    oneLiner: (s: ResolvedSelections) =>
      `${capitalize(s.productType)} that helps ${s.audience} improve ${s.problem} with a ${s.channel} go-to-market.`,
    solution: (_s: ResolvedSelections) =>
      "Centralizes the workflow with automation and real-time tracking.",
    intro: (s: ResolvedSelections) =>
      `Application for ${s.audience} in the ${s.sector} space that solves ${s.problem}. Distributed via ${s.channel} with an MVP-first approach.`,
    technicalHeader: "Technical prompt:",
  },
} as const;

function capitalize(value: string): string {
  if (!value) return value;
  return value[0].toUpperCase() + value.slice(1);
}

function pickUnique(pool: readonly string[], count: number): string[] {
  const copy = [...pool];
  const picked: string[] = [];
  while (copy.length > 0 && picked.length < count) {
    const idx = Math.floor(Math.random() * copy.length);
    picked.push(copy.splice(idx, 1)[0]);
  }
  return picked;
}

function pickOne(pool: readonly string[]): string {
  return pool[Math.floor(Math.random() * pool.length)];
}

function scoreFromSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash + seed.charCodeAt(i) * (i + 1)) % 997;
  }
  return 6 + (hash % 5);
}

function formatArchitectureLabel(value: string): string {
  const normalized = value.trim().replace(/[-_]+/g, " ");
  return normalized.replace(/\b\w/g, (match) => match.toUpperCase());
}

function buildPrompt(
  language: "es" | "en",
  request: IdeaRequest,
  selections: ResolvedSelections,
): { intro: string; technical: string } {
  const extra = request.extraNotes?.trim();
  const constraints = request.constraints;
  const architecture = request.architecture?.trim();
  const architectureMode =
    architecture === "__llm_best__" ? "llm_best" : architecture ? "manual" : "ignore";
  const architectureLabel =
    architectureMode === "manual" && architecture
      ? formatArchitectureLabel(architecture)
      : null;

  const patternConfig = request.selections.pattern;
  const stackConfig = request.selections.stack;

  const patternValue =
    patternConfig && patternConfig.mode !== "ignore" ? selections.pattern : null;
  const stackValue =
    stackConfig && stackConfig.mode !== "ignore" ? selections.stack : null;

  const patternLabel = patternValue ? formatArchitectureLabel(patternValue) : null;
  const stackLabel = stackValue ? formatArchitectureLabel(stackValue) : null;

  const techLinesEs = [
    "Objetivo: construir una app web simple y mantenible con Clean Code (codigo facil de leer).",
    `Nivel de plantilla: ${request.templateLevel}.`,
    ...(architectureMode === "manual" && architectureLabel
      ? [`Arquitectura: ${architectureLabel}.`]
      : architectureMode === "llm_best"
        ? ["Arquitectura: elige la mejor opcion y justificala brevemente."]
        : []),
    ...(patternLabel ? [`Patron: ${patternLabel}.`] : []),
    ...(stackLabel ? [`Stack: ${stackLabel}.`] : []),
    "Si aplica, organiza en capas: domain, application, infrastructure, interface.",
    "Define endpoints, modelos de datos y validaciones.",
    "Agrega tests unitarios minimos para casos de uso.",
    "Entrega estructura de carpetas y README breve.",
  ];

  const techLinesEn = [
    "Goal: build a simple, maintainable web app with Clean Code (easy-to-read code).",
    `Template level: ${request.templateLevel}.`,
    ...(architectureMode === "manual" && architectureLabel
      ? [`Architecture: ${architectureLabel}.`]
      : architectureMode === "llm_best"
        ? ["Architecture: choose the best option and justify it briefly."]
        : []),
    ...(patternLabel ? [`Pattern: ${patternLabel}.`] : []),
    ...(stackLabel ? [`Stack: ${stackLabel}.`] : []),
    "If applicable, organize layers: domain, application, infrastructure, interface.",
    "Define endpoints, data models, and validations.",
    "Add minimal unit tests for use cases.",
    "Deliver folder structure and a short README.",
  ];

  if (constraints) {
    const time = constraints.time?.trim();
    const effort = constraints.effort?.trim();
    const budget = constraints.budget?.trim();
    if (language === "es") {
      if (time) techLinesEs.push(`Tiempo disponible: ${time}.`);
      if (effort) techLinesEs.push(`Esfuerzo/capacidad: ${effort}.`);
      if (budget) techLinesEs.push(`Presupuesto: ${budget}.`);
    } else {
      if (time) techLinesEn.push(`Available time: ${time}.`);
      if (effort) techLinesEn.push(`Effort/capacity: ${effort}.`);
      if (budget) techLinesEn.push(`Budget: ${budget}.`);
    }
  }

  if (extra) {
    if (language === "es") {
      techLinesEs.push(`Notas extra: ${extra}.`);
    } else {
      techLinesEn.push(`Extra notes: ${extra}.`);
    }
  }

  const template = templates[language];
  const intro = template.intro(selections);
  const technical =
    language === "es"
      ? `${template.technicalHeader}\n${techLinesEs.join("\n")}`
      : `${template.technicalHeader}\n${techLinesEn.join("\n")}`;

  return { intro, technical };
}

function buildIdea(
  index: number,
  language: "es" | "en",
  selections: ResolvedSelections,
): Idea {
  const template = templates[language];
  const angle = angles[language][index % angles[language].length];
  const scoreValue = scoreFromSeed(
    `${selections.sector}-${selections.audience}-${index}`,
  );
  const scoreReasons = pickUnique(scoreReasonsPool[language], 3);
  const pros = pickUnique(prosPool[language], 3);
  const cons = pickUnique(consPool[language], 3);
  const mvp = pickUnique(mvpFeatures[language], 3);
  const validation = validationPool[language];

  return {
    title: template.title(selections),
    oneLiner: template.oneLiner(selections),
    sector: selections.sector,
    audience: selections.audience,
    problem: selections.problem,
    solution: template.solution(selections),
    differentiator:
      language === "es"
        ? `Diferenciador: ${angle}.`
        : `Differentiator: ${angle}.`,
    mvp,
    score: {
      value: scoreValue,
      reasons: scoreReasons,
    },
    pros,
    cons,
    painFrequency: pickOne(validation.painFrequency),
    willingnessToPay: pickOne(validation.willingnessToPay),
    alternatives: pickOne(validation.alternatives),
    roiImpact: pickOne(validation.roiImpact),
    adoptionFriction: pickOne(validation.adoptionFriction),
    acquisition: pickOne(validation.acquisition),
    retention: pickOne(validation.retention),
    risks: pickOne(validation.risks),
  };
}

export class LocalIdeaGenerator implements IdeaGenerator {
  async generate(
    request: IdeaRequest,
    resolved: ResolvedSelections,
    _llmOptions: LlmOptions,
  ): Promise<IdeaResponse> {
    const language = request.language === "en" ? "en" : "es";
    const ideas = Array.from({ length: 3 }, (_, index) =>
      buildIdea(index, language, resolved),
    );

    const prompt = buildPrompt(language, request, resolved);

    return {
      language,
      ideas,
      prompt,
    };
  }
}
