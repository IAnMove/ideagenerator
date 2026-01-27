import type { FastifyInstance } from "fastify";
import { Static } from "@sinclair/typebox";
import { IdeaRequestSchema } from "../schemas.js";

type IdeaRequestBody = Static<typeof IdeaRequestSchema>;

type LlmKeyHeader = string | string[] | undefined;

function getLlmApiKey(header: LlmKeyHeader): string | undefined {
  if (!header) return undefined;
  return Array.isArray(header) ? header[0] : header;
}

export function registerIdeaRoutes(app: FastifyInstance) {
  app.post<{ Body: IdeaRequestBody }>(
    "/api/v1/ideas",
    {
      schema: {
        body: IdeaRequestSchema,
      },
    },
    async (request, reply) => {
      try {
        const apiKey = getLlmApiKey(request.headers["x-llm-api-key"]);
        const body = apiKey
          ? { ...request.body, llm: { ...request.body.llm, apiKey } }
          : request.body;
        const response = await app.generateIdeas.execute(body);
        return reply.send(response);
      } catch (error) {
        request.log.error({ err: error }, "failed to generate ideas");
        return reply.status(400).send({ error: (error as Error).message });
      }
    },
  );
}
