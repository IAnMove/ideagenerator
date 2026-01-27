import { useEffect, useMemo, useState } from "react";

type SelectionMode = "manual" | "random" | "llm" | "none";

type ListName = "sector" | "audience" | "problem" | "productType" | "channel";

type SelectionConfig = {
  mode: SelectionMode;
  value: string;
};

type IdeaScore = { value: number; reasons: string[] };

type Idea = {
  title: string;
  oneLiner: string;
  sector: string;
  audience: string;
  problem: string;
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

type Lists = Record<ListName, string[]>;

type LanguageCode = "es" | "en";

type LlmProvider = "deepseek" | "openai";

type Constraints = {
  time: string;
  effort: string;
  budget: string;
};

const listOrder: ListName[] = [
  "sector",
  "audience",
  "problem",
  "productType",
  "channel",
];

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
    manual: "Manual",
    random: "Aleatorio",
    llm: "Sugiereme tu",
    none: "Sin definir",
    addItem: "Agregar",
    saveLists: "Guardar listas",
    extraNotes: "Notas extra (opcional)",
    constraints: "Restricciones (opcional)",
    time: "Tiempo disponible",
    effort: "Esfuerzo/capacidad",
    budget: "Presupuesto",
    generate: "Generar ideas",
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
    llmDisabledHint: "Desactivado = generacion local rapida",
    providerDeepSeek: "DeepSeek",
    providerOpenAi: "OpenAI",
    selectIdeaHint: "Selecciona una idea para generar el prompt de Codex.",
    codexPrompt: "Prompt para Codex",
    codexGenerating: "Optimizando prompt...",
    codexEmpty: "Selecciona una idea para generar el prompt.",
    copy: "Copiar",
    copied: "Copiado",
    validation: "Validacion",
    painFrequency: "Dolor y frecuencia",
    willingnessToPay: "Disposicion a pagar",
    alternatives: "Alternativas actuales",
    roiImpact: "ROI / impacto",
    adoptionFriction: "Friccion de adopcion",
    acquisition: "Adquisicion",
    retention: "Retencion",
    risks: "Riesgos",
    listLabels: {
      sector: "Sector",
      audience: "Publico",
      problem: "Problema",
      productType: "Tipo de producto",
      channel: "Canal",
    },
    listHints: {
      sector: "Ej: finanzas, salud, educacion",
      audience: "Ej: nomadas digitales, pymes",
      problem: "Ej: gestion de ingresos",
      productType: "Ej: saas, mobile app",
      channel: "Ej: seo, comunidades",
    },
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
    manual: "Manual",
    random: "Random",
    llm: "Suggest for me",
    none: "Undefined",
    addItem: "Add",
    saveLists: "Save lists",
    extraNotes: "Extra notes (optional)",
    constraints: "Constraints (optional)",
    time: "Available time",
    effort: "Effort/capacity",
    budget: "Budget",
    generate: "Generate ideas",
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
    llmDisabledHint: "Disabled = fast local generation",
    providerDeepSeek: "DeepSeek",
    providerOpenAi: "OpenAI",
    selectIdeaHint: "Select an idea to generate the Codex prompt.",
    codexPrompt: "Codex prompt",
    codexGenerating: "Optimizing prompt...",
    codexEmpty: "Select an idea to generate the prompt.",
    copy: "Copy",
    copied: "Copied",
    validation: "Validation",
    painFrequency: "Pain & frequency",
    willingnessToPay: "Willingness to pay",
    alternatives: "Current alternatives",
    roiImpact: "ROI / impact",
    adoptionFriction: "Adoption friction",
    acquisition: "Acquisition",
    retention: "Retention",
    risks: "Risks",
    listLabels: {
      sector: "Sector",
      audience: "Audience",
      problem: "Problem",
      productType: "Product type",
      channel: "Channel",
    },
    listHints: {
      sector: "Ex: finance, health, education",
      audience: "Ex: digital nomads, SMBs",
      problem: "Ex: income tracking",
      productType: "Ex: SaaS, mobile app",
      channel: "Ex: SEO, communities",
    },
  },
} as const;

const initialSelections: Record<ListName, SelectionConfig> = {
  sector: { mode: "random", value: "" },
  audience: { mode: "random", value: "" },
  problem: { mode: "random", value: "" },
  productType: { mode: "random", value: "" },
  channel: { mode: "random", value: "" },
};

const emptyLists: Lists = {
  sector: [],
  audience: [],
  problem: [],
  productType: [],
  channel: [],
};

export default function App() {
  const [language, setLanguage] = useState<LanguageCode>("es");
  const [templateLevel, setTemplateLevel] = useState<"basic" | "advanced">(
    "basic",
  );
  const [lists, setLists] = useState<Lists>(emptyLists);
  const [selections, setSelections] = useState(initialSelections);
  const [newItems, setNewItems] = useState<Record<ListName, string>>({
    sector: "",
    audience: "",
    problem: "",
    productType: "",
    channel: "",
  });
  const [extraNotes, setExtraNotes] = useState("");
  const [constraints, setConstraints] = useState<Constraints>({
    time: "",
    effort: "",
    budget: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IdeaResponse | null>(null);
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

  useEffect(() => {
    const loadLists = async () => {
      try {
        const response = await fetch("/api/v1/lists");
        if (!response.ok) throw new Error("Failed to load lists");
        const data = (await response.json()) as { lists: Lists };
        setLists(data.lists);
      } catch (err) {
        console.error(err);
      }
    };

    loadLists();
  }, []);

  const handleModeChange = (name: ListName, mode: SelectionMode) => {
    setSelections((prev) => ({
      ...prev,
      [name]: {
        mode,
        value: mode === "manual" ? prev[name].value : "",
      },
    }));
  };

  const handleValueChange = (name: ListName, value: string) => {
    setSelections((prev) => ({
      ...prev,
      [name]: {
        ...prev[name],
        value,
      },
    }));
  };

  const addListItem = (name: ListName) => {
    const value = newItems[name].trim();
    if (!value) return;
    setLists((prev) => {
      const exists = prev[name].some(
        (item) => item.toLowerCase() === value.toLowerCase(),
      );
      const updated = exists ? prev[name] : [...prev[name], value];
      return { ...prev, [name]: updated };
    });
    setNewItems((prev) => ({ ...prev, [name]: "" }));
  };

  const saveLists = async () => {
    try {
      await fetch("/api/v1/lists", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lists }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const canGenerate = useMemo(() => {
    return listOrder.every((name) => {
      const config = selections[name];
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
    resetCodexPrompt();

    try {
      const payload = {
        language,
        templateLevel,
        selections: {
          sector: selections.sector,
          audience: selections.audience,
          problem: selections.problem,
          productType: selections.productType,
          channel: selections.channel,
        },
        extraNotes: extraNotes.trim() || undefined,
        constraints: {
          time: constraints.time.trim() || undefined,
          effort: constraints.effort.trim() || undefined,
          budget: constraints.budget.trim() || undefined,
        },
        llm: {
          enabled: llmEnabled,
          provider: llmProvider,
          model: llmModel.trim() || undefined,
          baseUrl: llmBaseUrl.trim() || undefined,
        },
      };

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

  const handleSelectIdea = async (idea: Idea, index: number) => {
    setSelectedIdeaIndex(index);
    setCodexLoading(true);
    setCodexError(null);
    setCodexPrompt("");
    setCopied(false);

    try {
      const payload = {
        language,
        templateLevel,
        idea,
        extraNotes: extraNotes.trim() || undefined,
        constraints: {
          time: constraints.time.trim() || undefined,
          effort: constraints.effort.trim() || undefined,
          budget: constraints.budget.trim() || undefined,
        },
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
            {listOrder.map((name) => (
              <div className="field" key={name}>
                <div className="field-title">
                  <div>
                    <strong>{t.listLabels[name]}</strong>
                    <span>{t.listHints[name]}</span>
                  </div>
                  <div className="mode">
                    <label>{t.mode}</label>
                    <select
                      value={selections[name].mode}
                      onChange={(event) =>
                        handleModeChange(name, event.target.value as SelectionMode)
                      }
                    >
                      <option value="manual">{t.manual}</option>
                      <option value="random">{t.random}</option>
                      <option value="llm">{t.llm}</option>
                      <option value="none">{t.none}</option>
                    </select>
                  </div>
                </div>

                {selections[name].mode === "manual" ? (
                  <select
                    className="value-select"
                    value={selections[name].value}
                    onChange={(event) => handleValueChange(name, event.target.value)}
                  >
                    <option value="">--</option>
                    {lists[name]?.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="mode-note">
                    {selections[name].mode === "random"
                      ? t.random
                      : selections[name].mode === "llm"
                      ? t.llm
                      : t.none}
                  </div>
                )}

                <div className="adder">
                  <input
                    placeholder={t.addItem}
                    value={newItems[name]}
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
            ))}
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
              <button type="button" className="ghost" onClick={saveLists}>
                {t.saveLists}
              </button>
              <button
                type="button"
                className="primary"
                onClick={generateIdeas}
                disabled={!canGenerate || loading}
              >
                {loading ? t.loading : t.generate}
              </button>
            </div>
            {error ? <div className="error">{error}</div> : null}
          </div>
        </section>

        <section className="panel results">
          <div className="panel-header">
            <div>
              <h2>{t.results}</h2>
              <p className="hint">{t.selectIdeaHint}</p>
            </div>
            {result?.suggestedLanguage ? (
              <div className="badge">
                {t.suggestedLanguage}: {result.suggestedLanguage}
              </div>
            ) : null}
          </div>

          {!result ? (
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
          ) : (
            <div className="results-body">
              <div className="ideas">
                {result.ideas.map((idea, index) => (
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
                ))}
              </div>

              <div className="prompt">
                <h3>{t.prompt}</h3>
                <p>{result.prompt.intro}</p>
                <pre>{result.prompt.technical}</pre>
              </div>

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
