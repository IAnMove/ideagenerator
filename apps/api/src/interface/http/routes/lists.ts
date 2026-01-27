import type { FastifyInstance } from "fastify";
import { Static } from "@sinclair/typebox";
import { ListsUpdateSchema } from "../schemas.js";

type ListsUpdateBody = Static<typeof ListsUpdateSchema>;

export function registerListRoutes(app: FastifyInstance) {
  app.get("/api/v1/lists", async (_request, reply) => {
    const lists = await app.listsRepo.getAllLists();
    return reply.send({ lists });
  });

  app.put<{ Body: ListsUpdateBody }>(
    "/api/v1/lists",
    {
      schema: {
        body: ListsUpdateSchema,
      },
    },
    async (request, reply) => {
      await app.listsRepo.updateLists(request.body.lists);
      return reply.send({ ok: true });
    },
  );
}
