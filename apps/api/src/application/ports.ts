import type {
  CodexPromptRequest,
  CodexPromptResponse,
  IdeaRequest,
  IdeaResponse,
  ListName,
  ResolvedSelections,
} from "../domain/models.js";

export type LlmOptions = Partial<Record<ListName, string[]>>;

export interface ListsRepository {
  getAllLists(): Promise<Record<ListName, string[]>>;
  updateLists(lists: Record<ListName, string[]>): Promise<void>;
  getLanguages(): Promise<string[]>;
  updateLanguages(languages: string[]): Promise<void>;
}

export interface IdeaGenerator {
  generate(
    request: IdeaRequest,
    resolved: ResolvedSelections,
    llmOptions: LlmOptions,
  ): Promise<IdeaResponse>;
}

export interface CodexPromptGenerator {
  generate(request: CodexPromptRequest): Promise<CodexPromptResponse>;
}
