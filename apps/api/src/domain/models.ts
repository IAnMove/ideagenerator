export type LanguageCode = string;
export type TemplateLevel = "basic" | "advanced";
export type LlmProvider = "deepseek" | "openai";

export type ListName = string;

export type LocalizedText = Record<string, string>;

export type PromptTemplate = string | LocalizedText;

export interface ElementCategory {
  key: string;
  label?: LocalizedText;
  hint?: LocalizedText;
  options: Record<string, LocalizedText>;
}

export interface ElementsConfig {
  version: 1;
  categories: ElementCategory[];
  ideaPrompt?: PromptTemplate;
  ideaSystemPrompt?: PromptTemplate;
  productionPrompt?: PromptTemplate;
  productionSystemPrompt?: PromptTemplate;
}

export type SelectionMode = "manual" | "decide" | "ignore";

export interface SelectionConfig {
  mode: SelectionMode;
  value?: string | null;
}

export interface LlmConfig {
  enabled?: boolean;
  provider?: LlmProvider;
  model?: string;
  baseUrl?: string;
  apiKey?: string;
}

export interface IdeaConstraints {
  time?: string;
  effort?: string;
  budget?: string;
}

export interface IdeaRequest {
  language: LanguageCode;
  templateLevel: TemplateLevel;
  architecture?: string;
  selections: Partial<Record<ListName, SelectionConfig>>;
  elements?: ElementsConfig;
  extraNotes?: string;
  constraints?: IdeaConstraints;
  llm?: LlmConfig;
}

export interface IdeaScore {
  value: number;
  reasons: string[];
}

export interface Idea {
  title: string;
  oneLiner: string;
  inputs: Record<ListName, string>;
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
}

export interface IdeaPrompt {
  intro: string;
  technical: string;
}

export interface IdeaResponse {
  language: LanguageCode;
  ideas: Idea[];
  prompt: IdeaPrompt;
  suggestedLanguage?: string;
}

export type ResolvedSelections = Record<ListName, string>;

export interface CodexPromptRequest {
  language: LanguageCode;
  templateLevel: TemplateLevel;
  architecture?: string;
  pattern?: string;
  stack?: string;
  idea: Idea;
  elements?: ElementsConfig;
  extraNotes?: string;
  constraints?: IdeaConstraints;
  llm?: LlmConfig;
}

export interface CodexPromptResponse {
  prompt: string;
}
