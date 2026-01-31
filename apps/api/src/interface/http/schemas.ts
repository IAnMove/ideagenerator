import { Type } from "@sinclair/typebox";

export const SelectionModeSchema = Type.Union([
  Type.Literal("manual"),
  Type.Literal("decide"),
  Type.Literal("ignore"),
]);

export const SelectionConfigSchema = Type.Object({
  mode: SelectionModeSchema,
  value: Type.Optional(Type.Union([Type.String(), Type.Null()])),
});

export const LlmConfigSchema = Type.Object({
  enabled: Type.Optional(Type.Boolean()),
  provider: Type.Optional(
    Type.Union([Type.Literal("deepseek"), Type.Literal("openai")]),
  ),
  model: Type.Optional(Type.String()),
  baseUrl: Type.Optional(Type.String()),
  apiKey: Type.Optional(Type.String()),
});

export const ConstraintsSchema = Type.Object({
  time: Type.Optional(Type.String()),
  effort: Type.Optional(Type.String()),
  budget: Type.Optional(Type.String()),
});

export const IdeaSchema = Type.Object({
  title: Type.String(),
  oneLiner: Type.String(),
  sector: Type.String(),
  audience: Type.String(),
  problem: Type.String(),
  solution: Type.String(),
  differentiator: Type.String(),
  mvp: Type.Array(Type.String()),
  score: Type.Object({
    value: Type.Number(),
    reasons: Type.Array(Type.String()),
  }),
  pros: Type.Array(Type.String()),
  cons: Type.Array(Type.String()),
  painFrequency: Type.String(),
  willingnessToPay: Type.String(),
  alternatives: Type.String(),
  roiImpact: Type.String(),
  adoptionFriction: Type.String(),
  acquisition: Type.String(),
  retention: Type.String(),
  risks: Type.String(),
});

export const IdeaRequestSchema = Type.Object({
  language: Type.String({ minLength: 2 }),
  templateLevel: Type.Union([Type.Literal("basic"), Type.Literal("advanced")]),
  architecture: Type.Optional(Type.String({ minLength: 1 })),
  selections: Type.Partial(
    Type.Object({
      sector: SelectionConfigSchema,
      audience: SelectionConfigSchema,
      problem: SelectionConfigSchema,
      productType: SelectionConfigSchema,
      channel: SelectionConfigSchema,
      pattern: SelectionConfigSchema,
      stack: SelectionConfigSchema,
    }),
  ),
  extraNotes: Type.Optional(Type.String()),
  constraints: Type.Optional(ConstraintsSchema),
  llm: Type.Optional(LlmConfigSchema),
});

export const CodexPromptRequestSchema = Type.Object({
  language: Type.String({ minLength: 2 }),
  templateLevel: Type.Union([Type.Literal("basic"), Type.Literal("advanced")]),
  architecture: Type.Optional(Type.String({ minLength: 1 })),
  pattern: Type.Optional(Type.String({ minLength: 1 })),
  stack: Type.Optional(Type.String({ minLength: 1 })),
  idea: IdeaSchema,
  extraNotes: Type.Optional(Type.String()),
  constraints: Type.Optional(ConstraintsSchema),
  llm: Type.Optional(LlmConfigSchema),
});

export const ListsSchema = Type.Object({
  sector: Type.Array(Type.String()),
  audience: Type.Array(Type.String()),
  problem: Type.Array(Type.String()),
  productType: Type.Array(Type.String()),
  channel: Type.Array(Type.String()),
  pattern: Type.Array(Type.String()),
  stack: Type.Array(Type.String()),
});

export const ListsUpdateSchema = Type.Object({
  lists: ListsSchema,
});

export const LanguagesSchema = Type.Object({
  languages: Type.Array(Type.String()),
});
