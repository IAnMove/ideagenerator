import fastify from "fastify";
import cors from "@fastify/cors";
import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import path from "node:path";
import { JsonStore } from "../../infrastructure/json-store.js";
import { LocalIdeaGenerator } from "../../application/local-idea-generator.js";
import { LocalCodexPromptGenerator } from "../../application/local-codex-prompt-generator.js";
import { DeepSeekIdeaGenerator } from "../../infrastructure/deepseek-idea-generator.js";
import { OpenAiIdeaGenerator } from "../../infrastructure/openai-idea-generator.js";
import { DeepSeekCodexPromptGenerator } from "../../infrastructure/deepseek-codex-prompt-generator.js";
import { OpenAiCodexPromptGenerator } from "../../infrastructure/openai-codex-prompt-generator.js";
import { IdeaGeneratorRouter } from "../../application/idea-generator-router.js";
import { CodexPromptRouter } from "../../application/codex-prompt-router.js";
import type { CodexPromptGenerator, IdeaGenerator } from "../../application/ports.js";
import type { LlmProvider } from "../../domain/models.js";
import { GenerateIdeasUseCase } from "../../application/generate-ideas.js";
import { GenerateCodexPromptUseCase } from "../../application/generate-codex-prompt.js";
import { registerIdeaRoutes } from "./routes/ideas.js";
import { registerListRoutes } from "./routes/lists.js";
import { registerLanguageRoutes } from "./routes/languages.js";
import { registerCodexPromptRoutes } from "./routes/codex-prompt.js";

export async function buildServer() {
  const app = fastify({
    logger: {
      redact: {
        paths: [
          "req.headers.authorization",
          "req.headers[\"x-llm-api-key\"]",
          "req.body.llm.apiKey",
        ],
        remove: true,
      },
    },
  }).withTypeProvider<TypeBoxTypeProvider>();

  await app.register(cors, { origin: true });

  const dataPath = process.env.DATA_PATH
    ? path.resolve(process.env.DATA_PATH)
    : path.resolve(process.cwd(), "data", "store.json");

  const listsRepo = new JsonStore(dataPath);
  const localGenerator = new LocalIdeaGenerator();
  const localCodexPrompt = new LocalCodexPromptGenerator();

  const useLlm = (process.env.USE_LLM ?? "false").toLowerCase() === "true";
  const defaultProvider = ((process.env.LLM_PROVIDER ?? "deepseek").toLowerCase() ||
    "deepseek") as LlmProvider;

  const ideaProviders: Partial<Record<LlmProvider, IdeaGenerator>> = {};
  const codexProviders: Partial<Record<LlmProvider, CodexPromptGenerator>> = {};

  const deepseekKey = "";
  app.log.info("LLM API keys are provided per request via x-llm-api-key.");
  ideaProviders.deepseek = new DeepSeekIdeaGenerator({
    apiKey: deepseekKey,
    baseUrl: process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com",
    model: process.env.DEEPSEEK_MODEL ?? "deepseek-chat",
    timeoutMs: 60000,
  });
  codexProviders.deepseek = new DeepSeekCodexPromptGenerator({
    apiKey: deepseekKey,
    baseUrl: process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com",
    model: process.env.DEEPSEEK_MODEL ?? "deepseek-chat",
    timeoutMs: 60000,
  });

  const openaiKey = "";
  ideaProviders.openai = new OpenAiIdeaGenerator({
    apiKey: openaiKey,
    baseUrl: process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1",
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    timeoutMs: 60000,
  });
  codexProviders.openai = new OpenAiCodexPromptGenerator({
    apiKey: openaiKey,
    baseUrl: process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1",
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    timeoutMs: 60000,
  });

  const generator = new IdeaGeneratorRouter(localGenerator, ideaProviders, {
    useLlm,
    provider: defaultProvider,
  });

  const codexGenerator = new CodexPromptRouter(localCodexPrompt, codexProviders, {
    useLlm,
    provider: defaultProvider,
  });

  const generateIdeas = new GenerateIdeasUseCase(listsRepo, generator);
  const generateCodexPrompt = new GenerateCodexPromptUseCase(codexGenerator);

  app.decorate("listsRepo", listsRepo);
  app.decorate("generateIdeas", generateIdeas);
  app.decorate("generateCodexPrompt", generateCodexPrompt);

  app.get("/health", async () => ({ status: "ok" }));

  registerIdeaRoutes(app);
  registerCodexPromptRoutes(app);
  registerListRoutes(app);
  registerLanguageRoutes(app);

  return app;
}
