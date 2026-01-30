export type LanguageCode = string;
export type TemplateLevel = "basic" | "advanced";
export type SelectionMode = "manual" | "random" | "llm" | "none";
export type LlmProvider = "deepseek" | "openai";

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
  selections: {
    sector: SelectionConfig;
    audience: SelectionConfig;
    problem: SelectionConfig;
    productType: SelectionConfig;
    channel: SelectionConfig;
  };
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

export interface ResolvedSelections {
  sector: string;
  audience: string;
  problem: string;
  productType: string;
  channel: string;
}

export interface CodexPromptRequest {
  language: LanguageCode;
  templateLevel: TemplateLevel;
  architecture?: string;
  idea: Idea;
  extraNotes?: string;
  constraints?: IdeaConstraints;
  llm?: LlmConfig;
}

export interface CodexPromptResponse {
  prompt: string;
}

export type ListName =
  | "sector"
  | "audience"
  | "problem"
  | "productType"
  | "channel";
