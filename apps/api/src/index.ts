import "dotenv/config";
import { buildServer } from "./interface/http/server.js";

const port = Number(process.env.PORT ?? 3001);
const host = process.env.HOST ?? "0.0.0.0";

const app = await buildServer();

try {
  await app.listen({ port, host });
  app.log.info(`API listening on ${host}:${port}`);
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
