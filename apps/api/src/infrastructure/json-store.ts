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
    audience: ["nomadas_digitales", "freelancers", "pymes"],
    problem: ["gestion_de_ingresos", "organizacion_de_tareas"],
    productType: ["saas", "mobile_app"],
    channel: ["seo", "comunidades"],
    pattern: ["ddd"],
    stack: ["typescript"],
  },
  languages: ["es", "en"],
};

export class JsonStore implements ListsRepository {
  constructor(private readonly filePath: string) {}

  private async readStore(): Promise<StoreShape> {
    try {
      const raw = await fs.readFile(this.filePath, "utf-8");
      const sanitized = raw.replace(/^\uFEFF/, "");
      const parsed = JSON.parse(sanitized) as Partial<StoreShape>;

      const mergedLists: Record<ListName, string[]> = {
        ...defaultStore.lists,
        ...(parsed.lists ?? {}),
      } as Record<ListName, string[]>;

      let changed = false;
      for (const key of Object.keys(defaultStore.lists) as ListName[]) {
        const value = mergedLists[key];
        if (!Array.isArray(value)) {
          mergedLists[key] = defaultStore.lists[key];
          changed = true;
          continue;
        }

        const filtered = value.filter(
          (item): item is string => typeof item === "string",
        );
        if (filtered.length !== value.length) {
          mergedLists[key] = filtered;
          changed = true;
        }
      }

      const languages = Array.isArray(parsed.languages)
        ? parsed.languages.filter((item): item is string => typeof item === "string")
        : defaultStore.languages;

      if (!Array.isArray(parsed.languages)) {
        changed = true;
      }

      const merged: StoreShape = { lists: mergedLists, languages };

      if (changed) {
        await this.writeStore(merged);
      }

      return merged;
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
