import type {
  CreatePromptInput,
  PaginatedResult,
  Prompt,
  PromptDetail,
  PromptFilter,
  PromptListItem,
  UpdatePromptInput,
} from '../entities/prompt'

export interface PromptRepository {
  create(input: CreatePromptInput & { creatorId: string }): Promise<Prompt>
  findById(id: string): Promise<Prompt | null>
  findByCreatorId(creatorId: string, filter: PromptFilter): Promise<PaginatedResult<PromptListItem>>
  listPublished(filter: PromptFilter): Promise<PaginatedResult<PromptListItem>>
  getDetail(id: string): Promise<PromptDetail | null>
  update(id: string, input: UpdatePromptInput): Promise<Prompt | null>
  delete(id: string): Promise<boolean>
}
