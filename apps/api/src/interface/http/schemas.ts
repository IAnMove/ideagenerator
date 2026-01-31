import { Type } from "@sinclair/typebox";

export const SelectionModeSchema = Type.Union([
  Type.Literal("manual"),
  Type.Literal("decide"),
  Type.Literal("random"),
  Type.Literal("ignore"),
]);

export const SelectionConfigSchema = Type.Object({
  mode: SelectionModeSchema,
  value: Type.Optional(Type.Union([Type.String(), Type.Null()])),
});

const LocalizedTextSchema = Type.Record(Type.String(), Type.String());

const ElementCategorySchema = Type.Object({
  key: Type.String({ minLength: 1 }),
  label: Type.Optional(LocalizedTextSchema),
  hint: Type.Optional(LocalizedTextSchema),
  options: Type.Record(Type.String(), LocalizedTextSchema),
});

const ElementsSchema = Type.Object({
  version: Type.Literal(1),
  categories: Type.Array(ElementCategorySchema),
  ideaPrompt: Type.Optional(Type.Union([Type.String(), LocalizedTextSchema])),
  ideaSystemPrompt: Type.Optional(
    Type.Union([Type.String(), LocalizedTextSchema]),
  ),
  productionPrompt: Type.Optional(
    Type.Union([Type.String(), LocalizedTextSchema]),
  ),
  productionSystemPrompt: Type.Optional(
    Type.Union([Type.String(), LocalizedTextSchema]),
  ),
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
  inputs: Type.Record(Type.String(), Type.String()),
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
  selections: Type.Record(Type.String(), SelectionConfigSchema),
  elements: Type.Optional(ElementsSchema),
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
  elements: Type.Optional(ElementsSchema),
  extraNotes: Type.Optional(Type.String()),
  constraints: Type.Optional(ConstraintsSchema),
  llm: Type.Optional(LlmConfigSchema),
});

export const ListsSchema = Type.Record(Type.String(), Type.Array(Type.String()));

export const ListsUpdateSchema = Type.Object({
  lists: ListsSchema,
});

export const LanguagesSchema = Type.Object({
  languages: Type.Array(Type.String()),
});
