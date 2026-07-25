
import type { PromptMedia } from '../../domain/entities/prompt'
import type { CreateMediaData, MediaRepository } from '../../domain/repositories/media-repository'

/**
 * In-memory MediaRepository for development/testing on Lambda.
 */
export class MemoryMediaRepository implements MediaRepository {
  private media: Map<string, PromptMedia> = new Map()

  async create(data: CreateMediaData): Promise<PromptMedia> {
    const now = new Date().toISOString()
    const item: PromptMedia = {
      id: crypto.randomUUID(),
      promptId: data.promptId ?? '',
      url: data.url,
      mediaType: data.mediaType,
      sortOrder: data.sortOrder,
      createdAt: now,
    }
    this.media.set(item.id, item)
    return item
  }

  async bulkCreate(data: CreateMediaData[]): Promise<PromptMedia[]> {
    return Promise.all(data.map((d) => this.create(d)))
  }

  async findByPromptId(promptId: string): Promise<PromptMedia[]> {
    return Array.from(this.media.values()).filter((m) => m.promptId === promptId)
  }

  async findById(id: string): Promise<PromptMedia | null> {
    return this.media.get(id) ?? null
  }

  async deleteByPromptId(promptId: string): Promise<void> {
    for (const [id, item] of this.media) {
      if (item.promptId === promptId) {
        this.media.delete(id)
      }
    }
  }

  async unlinkFromPrompt(promptId: string): Promise<void> {
    for (const [id, item] of this.media) {
      if (item.promptId === promptId) {
        this.media.set(id, { ...item, promptId: '' })
      }
    }
  }

  async delete(id: string): Promise<boolean> {
    return this.media.delete(id)
  }
}
