import type { Idea, IdeaConstraints, TemplateLevel } from "../domain/models.js";

function formatArchitectureLabel(value: string): string {
  const normalized = value.trim().replace(/[-_]+/g, " ");
  return normalized.replace(/\b\w/g, (match) => match.toUpperCase());
}

export function buildCodexBase(
  language: "es" | "en",
  architecture?: string,
): string {
  const archKey = architecture?.trim();
  const architectureMode =
    archKey === "__llm_best__" ? "llm_best" : archKey ? "manual" : "ignore";
  const archLabel =
    architectureMode === "manual" && archKey ? formatArchitectureLabel(archKey) : null;

  if (language === "en") {
    const architectureLines =
      architectureMode === "manual" && archKey && archLabel
        ? [
            `Target architecture: ${archLabel} (key: ${archKey}).`,
            `Follow ${archLabel} and Clean Code.`,
          ]
        : architectureMode === "llm_best"
          ? [
              "Architecture: choose the best-fit option and justify it briefly in architecture.md.",
              "Then implement the project accordingly.",
            ]
          : [];

    return [
      "You are Codex, a senior coding agent.",
      "Build the project with simplicity + Clean Code (easy-to-read code).",
      ...architectureLines,
      "Deliverables:",
      "- agent.md with rules for the coding agent",
      "- architecture.md with key decisions and system design",
      "- todo.md with a prioritized step-by-step plan",
      "- project structure and initial implementation",
      "- minimal tests for core use cases",
      "Rules:",
      "- Keep domain logic pure and independent",
      "- Separate application, infrastructure, and interface layers",
      "- Validate inputs and handle errors",
      "- Use clear naming, small functions, and avoid duplication",
      "- Document endpoints and data models",
    ].join("\n");
  }

  const architectureLines =
    architectureMode === "manual" && archKey && archLabel
      ? [
          `Arquitectura objetivo: ${archLabel} (key: ${archKey}).`,
          `Sigue ${archLabel} y Clean Code.`,
        ]
      : architectureMode === "llm_best"
        ? [
            "Arquitectura: elige la mejor opcion y justificala brevemente en architecture.md.",
            "Luego implementa el proyecto en consecuencia.",
          ]
        : [];

  return [
    "Eres Codex, un agente de desarrollo senior.",
    "Construye el proyecto con simplicidad + Clean Code (codigo facil de leer).",
    ...architectureLines,
    "Entregables:",
    "- agent.md con reglas para el agente",
    "- architecture.md con decisiones clave y diseno del sistema",
    "- todo.md con un plan paso a paso priorizado",
    "- estructura del proyecto e implementacion inicial",
    "- tests minimos para casos de uso centrales",
    "Reglas:",
    "- Mantener el dominio puro e independiente",
    "- Separar capas application, infrastructure e interface",
    "- Validar entradas y manejar errores",
    "- Nombres claros, funciones pequenas y sin duplicacion",
    "- Documentar endpoints y modelos de datos",
  ].join("\n");
}

export function formatIdeaContext(
  idea: Idea,
  templateLevel: TemplateLevel,
  language: "es" | "en",
  extraNotes?: string,
  constraints?: IdeaConstraints,
  architecture?: string,
): string {
  const labels =
    language === "en"
      ? {
          title: "Title",
          oneLiner: "One-liner",
          sector: "Sector",
          audience: "Audience",
          problem: "Problem",
          solution: "Solution",
          differentiator: "Differentiator",
          mvp: "MVP",
          score: "Score",
          pain: "Pain/Frequency",
          pay: "Willingness to pay",
          alternatives: "Alternatives",
          roi: "ROI/Impact",
          friction: "Adoption friction",
          acquisition: "Acquisition",
          retention: "Retention",
          risks: "Risks",
          template: "Template level",
          architecture: "Architecture",
        }
      : {
          title: "Titulo",
          oneLiner: "One-liner",
          sector: "Sector",
          audience: "Publico",
          problem: "Problema",
          solution: "Solucion",
          differentiator: "Diferenciador",
          mvp: "MVP",
          score: "Puntuacion",
          pain: "Dolor/Frecuencia",
          pay: "Disposicion a pagar",
          alternatives: "Alternativas",
          roi: "ROI/Impacto",
          friction: "Friccion de adopcion",
          acquisition: "Adquisicion",
          retention: "Retencion",
          risks: "Riesgos",
          template: "Nivel de plantilla",
          architecture: "Arquitectura",
        };

  const lines = [
    language === "en" ? "Selected idea:" : "Idea seleccionada:",
    `- ${labels.title}: ${idea.title}`,
    `- ${labels.oneLiner}: ${idea.oneLiner}`,
    `- ${labels.sector}: ${idea.sector}`,
    `- ${labels.audience}: ${idea.audience}`,
    `- ${labels.problem}: ${idea.problem}`,
    `- ${labels.solution}: ${idea.solution}`,
    `- ${labels.differentiator}: ${idea.differentiator}`,
    `- ${labels.mvp}: ${idea.mvp.join(", ")}`,
    `- ${labels.score}: ${idea.score.value} (${idea.score.reasons.join(", ")})`,
    `- ${labels.pain}: ${idea.painFrequency}`,
    `- ${labels.pay}: ${idea.willingnessToPay}`,
    `- ${labels.alternatives}: ${idea.alternatives}`,
    `- ${labels.roi}: ${idea.roiImpact}`,
    `- ${labels.friction}: ${idea.adoptionFriction}`,
    `- ${labels.acquisition}: ${idea.acquisition}`,
    `- ${labels.retention}: ${idea.retention}`,
    `- ${labels.risks}: ${idea.risks}`,
    `- ${labels.template}: ${templateLevel}`,
  ];

  const archKey = architecture?.trim();
  if (archKey && archKey !== "__llm_best__") {
    const archLabel = formatArchitectureLabel(archKey);
    lines.push(`- ${labels.architecture}: ${archLabel} (key: ${archKey})`);
  }

  if (constraints) {
    if (constraints.time?.trim()) {
      lines.push(
        `${language === "en" ? "Available time" : "Tiempo disponible"}: ${constraints.time.trim()}`,
      );
    }
    if (constraints.effort?.trim()) {
      lines.push(
        `${language === "en" ? "Effort/capacity" : "Esfuerzo/capacidad"}: ${constraints.effort.trim()}`,
      );
    }
    if (constraints.budget?.trim()) {
      lines.push(
        `${language === "en" ? "Budget" : "Presupuesto"}: ${constraints.budget.trim()}`,
      );
    }
  }

  if (extraNotes?.trim()) {
    lines.push(
      `${language === "en" ? "Extra notes" : "Notas extra"}: ${extraNotes.trim()}`,
    );
  }

  return lines.join("\n");
}
