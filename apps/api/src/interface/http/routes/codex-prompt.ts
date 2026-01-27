import type { FastifyInstance } from "fastify";
import { Static } from "@sinclair/typebox";
import { CodexPromptRequestSchema } from "../schemas.js";

type CodexPromptBody = Static<typeof CodexPromptRequestSchema>;

type LlmKeyHeader = string | string[] | undefined;

function getLlmApiKey(header: LlmKeyHeader): string | undefined {
  if (!header) return undefined;
  return Array.isArray(header) ? header[0] : header;
}

export function registerCodexPromptRoutes(app: FastifyInstance) {
  app.post<{ Body: CodexPromptBody }>(
    "/api/v1/codex-prompt",
    {
      schema: {
        body: CodexPromptRequestSchema,
      },
    },
    async (request, reply) => {
      try {
        const apiKey = getLlmApiKey(request.headers["x-llm-api-key"]);
        const body = apiKey
          ? { ...request.body, llm: { ...request.body.llm, apiKey } }
          : request.body;
        const response = await app.generateCodexPrompt.execute(body);
        return reply.send(response);
      } catch (error) {
        request.log.error({ err: error }, "failed to generate codex prompt");
        return reply.status(400).send({ error: (error as Error).message });
      }
    },
  );
}
