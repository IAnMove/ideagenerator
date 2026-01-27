import { promises as fs } from "node:fs";
import path from "node:path";
import type { ListsRepository } from "../application/ports.js";
import type { ListName } from "../domain/models.js";

interface StoreShape {
  lists: Record<ListName, string[]>;
  languages: string[];
}

const defaultStore: StoreShape = {
  lists: {
    sector: ["finanzas", "salud", "educacion"],
    audience: ["nomadas digitales", "freelancers", "pymes"],
    problem: ["gestion de ingresos", "organizacion de tareas"],
    productType: ["saas", "mobile app"],
    channel: ["seo", "comunidades"],
  },
  languages: ["es", "en"],
};

export class JsonStore implements ListsRepository {
  constructor(private readonly filePath: string) {}

  private async readStore(): Promise<StoreShape> {
    try {
      const raw = await fs.readFile(this.filePath, "utf-8");
      const sanitized = raw.replace(/^\uFEFF/, "");
      const data = JSON.parse(sanitized) as StoreShape;
      return data;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        await this.writeStore(defaultStore);
        return defaultStore;
      }
      throw error;
    }
  }

  private async writeStore(data: StoreShape): Promise<void> {
    const dir = path.dirname(this.filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(this.filePath, JSON.stringify(data, null, 2), "utf-8");
  }

  async getAllLists(): Promise<Record<ListName, string[]>> {
    const store = await this.readStore();
    return store.lists;
  }

  async updateLists(lists: Record<ListName, string[]>): Promise<void> {
    const store = await this.readStore();
    await this.writeStore({ ...store, lists });
  }

  async getLanguages(): Promise<string[]> {
    const store = await this.readStore();
    return store.languages ?? [];
  }

  async updateLanguages(languages: string[]): Promise<void> {
    const store = await this.readStore();
    await this.writeStore({ ...store, languages });
  }
}
