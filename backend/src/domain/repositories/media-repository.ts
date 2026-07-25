import type { PromptMedia } from '../entities/prompt'

export interface CreateMediaData {
  promptId?: string
  url: string
  mediaType: 'image' | 'video'
  sortOrder: number
}

export interface MediaRepository {
  create(data: CreateMediaData): Promise<PromptMedia>
  bulkCreate(data: CreateMediaData[]): Promise<PromptMedia[]>
  findByPromptId(promptId: string): Promise<PromptMedia[]>
  findById(id: string): Promise<PromptMedia | null>
  unlinkFromPrompt(promptId: string): Promise<void>
  deleteByPromptId(promptId: string): Promise<void>
  delete(id: string): Promise<boolean>
}
