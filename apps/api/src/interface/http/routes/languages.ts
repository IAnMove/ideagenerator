import type { FastifyInstance } from "fastify";
import { Static } from "@sinclair/typebox";
import { LanguagesSchema } from "../schemas.js";

type LanguagesBody = Static<typeof LanguagesSchema>;

export function registerLanguageRoutes(app: FastifyInstance) {
  app.get("/api/v1/languages", async (_request, reply) => {
    const languages = await app.listsRepo.getLanguages();
    return reply.send({ languages });
  });

  app.put<{ Body: LanguagesBody }>(
    "/api/v1/languages",
    {
      schema: {
        body: LanguagesSchema,
      },
    },
    async (request, reply) => {
      await app.listsRepo.updateLanguages(request.body.languages);
      return reply.send({ ok: true });
    },
  );
}
