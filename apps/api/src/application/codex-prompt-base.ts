import type { Idea, IdeaConstraints, TemplateLevel } from "../domain/models.js";

export function buildCodexBase(language: "es" | "en"): string {
  if (language === "en") {
    return [
      "You are Codex, a senior coding agent.",
      "Build the project following Clean Architecture and Clean Code.",
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

  return [
    "Eres Codex, un agente de desarrollo senior.",
    "Construye el proyecto siguiendo Clean Architecture y Clean Code.",
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
