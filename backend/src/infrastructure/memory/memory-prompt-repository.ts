
import type {
  CreatePromptInput,
  PaginatedResult,
  Prompt,
  PromptDetail,
  PromptFilter,
  PromptListItem,
  UpdatePromptInput,
} from '../../domain/entities/prompt'
import type { PromptRepository } from '../../domain/repositories/prompt-repository'

/**
 * In-memory PromptRepository for development/testing on Lambda.
 */
export class MemoryPromptRepository implements PromptRepository {
  private prompts: Map<string, Prompt> = new Map()

  async create(input: CreatePromptInput & { creatorId: string }): Promise<Prompt> {
    const now = new Date().toISOString()
    const prompt: Prompt = {
      id: crypto.randomUUID(),
      creatorId: input.creatorId,
      title: input.title,
      description: input.description ?? '',
      price: input.price,
      modelType: input.modelType,
      parameters: input.parameters ?? {},
      content: input.content,
      status: (input.status ?? 'draft') as Prompt['status'],
      createdAt: now,
      updatedAt: now,
    }
    this.prompts.set(prompt.id, prompt)
    return prompt
  }

  async findById(id: string): Promise<Prompt | null> {
    return this.prompts.get(id) ?? null
  }

  async findByCreatorId(
    creatorId: string,
    filter: PromptFilter
  ): Promise<PaginatedResult<PromptListItem>> {
    const all = Array.from(this.prompts.values())
      .filter((p) => p.creatorId === creatorId)
      .filter((p) => !filter.status || p.status === filter.status)

    return this.toListResult(all, filter)
  }

  async listPublished(filter: PromptFilter): Promise<PaginatedResult<PromptListItem>> {
    let all = Array.from(this.prompts.values()).filter((p) => p.status === 'published')

    if (filter.modelType) all = all.filter((p) => p.modelType === filter.modelType)
    if (filter.search) {
      const q = filter.search.toLowerCase()
      all = all.filter((p) => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))
    }
    if (filter.minPrice !== undefined) all = all.filter((p) => p.price >= filter.minPrice!)
    if (filter.maxPrice !== undefined) all = all.filter((p) => p.price <= filter.maxPrice!)

    return this.toListResult(all, filter)
  }

  async getDetail(id: string): Promise<PromptDetail | null> {
    const prompt = this.prompts.get(id)
    if (!prompt) return null
    return {
      ...prompt,
      previewMedia: [],
      media: [],
      creator: { id: prompt.creatorId, displayName: 'Unknown' },
    }
  }

  async update(id: string, input: UpdatePromptInput): Promise<Prompt | null> {
    const existing = this.prompts.get(id)
    if (!existing) return null
    const updated: Prompt = {
      ...existing,
      ...(input.title !== undefined && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.price !== undefined && { price: input.price }),
      ...(input.modelType !== undefined && { modelType: input.modelType }),
      ...(input.parameters !== undefined && { parameters: input.parameters }),
      ...(input.content !== undefined && { content: input.content }),
      ...(input.status !== undefined && { status: input.status }),
      updatedAt: new Date().toISOString(),
    }
    this.prompts.set(id, updated)
    return updated
  }

  async delete(id: string): Promise<boolean> {
    return this.prompts.delete(id)
  }

  private toListResult(
    items: Prompt[],
    filter: PromptFilter
  ): PaginatedResult<PromptListItem> {
    const sort = filter.sort ?? 'newest'
    const limit = filter.limit ?? 20

    const sorted = [...items].sort((a, b) => {
      switch (sort) {
        case 'newest': return b.createdAt.localeCompare(a.createdAt)
        case 'oldest': return a.createdAt.localeCompare(b.createdAt)
        case 'price_asc': return a.price - b.price
        case 'price_desc': return b.price - a.price
        default: return 0
      }
    })

    const start = filter.cursor ? sorted.findIndex((p) => p.id === filter.cursor) + 1 : 0
    if (start < 0) return { data: [], pagination: { cursor: null, hasMore: false } }

    const page = sorted.slice(start, start + limit)
    const hasMore = start + limit < sorted.length

    return {
      data: page.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        price: p.price,
        modelType: p.modelType,
        status: p.status,
        previewMedia: [],
        creator: { id: p.creatorId, displayName: 'Unknown' },
        createdAt: p.createdAt,
      })),
      pagination: {
        cursor: page.length > 0 ? page[page.length - 1]!.id : null,
        hasMore,
      },
    }
  }
}
