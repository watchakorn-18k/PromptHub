import type {
  CreatePromptInput,
  PaginatedResult,
  Prompt,
  PromptDetail,
  PromptFilter,
  PromptListItem,
  UpdatePromptInput,
} from '../domain/entities/prompt'
import { ForbiddenError, NotFoundError } from '../domain/errors'
import type { MediaRepository } from '../domain/repositories/media-repository'
import type { PromptRepository } from '../domain/repositories/prompt-repository'
import type { UserRepository } from '../domain/repositories/user-repository'

export class PromptService {
  constructor(
    private readonly promptRepository: PromptRepository,
    private readonly mediaRepository: MediaRepository,
    private readonly userRepository?: UserRepository
  ) {}

  async create(
    input: CreatePromptInput,
    creatorId: string
  ): Promise<PromptDetail> {
    const prompt = await this.promptRepository.create({
      ...input,
      creatorId,
    })

    // Attach pre-uploaded media if provided
    if (input.mediaIds && input.mediaIds.length > 0) {
      // Update media rows to link them to this prompt
      const mediaItems = await Promise.all(
        input.mediaIds.map((mediaId, idx) =>
          this.mediaRepository.create({
            promptId: prompt.id,
            url: '', // We'll update with existing media URL
            mediaType: 'image', // Overwritten below
            sortOrder: idx,
          })
        )
      )

      // Fetch original media items to get their url/mediaType, then update
      for (let i = 0; i < input.mediaIds.length; i++) {
        const existing = await this.mediaRepository.findById(input.mediaIds[i]!)
        if (existing) {
          // Unlink from previous prompt (if any) — but media IDs are unique so they shouldn't be linked yet
          await this.mediaRepository.delete(existing.id)
          // Re-create with correct promptId
          await this.mediaRepository.create({
            promptId: prompt.id,
            url: existing.url,
            mediaType: existing.mediaType,
            sortOrder: i,
          })
        }
      }
    }

    const detail = await this.promptRepository.getDetail(prompt.id)
    if (!detail) throw new Error('Failed to retrieve created prompt')
    return detail
  }

  async listPublished(filter: PromptFilter): Promise<PaginatedResult<PromptListItem>> {
    // Public listing always filters to published only
    return this.promptRepository.listPublished(filter)
  }

  async findByCreator(
    creatorId: string,
    filter: PromptFilter
  ): Promise<PaginatedResult<PromptListItem>> {
    return this.promptRepository.findByCreatorId(creatorId, filter)
  }

  async getDetail(id: string, userId?: string): Promise<PromptDetail> {
    const prompt = await this.promptRepository.findById(id)
    if (!prompt) throw new NotFoundError('Prompt')

    // If draft or archived and not owner, deny
    if (prompt.status !== 'published' && prompt.creatorId !== userId) {
      throw new ForbiddenError('This prompt is not published')
    }

    const detail = await this.promptRepository.getDetail(id)
    if (!detail) throw new NotFoundError('Prompt')
    return detail
  }

  async update(
    id: string,
    input: UpdatePromptInput,
    userId: string
  ): Promise<PromptDetail> {
    const existing = await this.promptRepository.findById(id)
    if (!existing) throw new NotFoundError('Prompt')
    if (existing.creatorId !== userId) {
      throw new ForbiddenError('You can only update your own prompts')
    }

    const updated = await this.promptRepository.update(id, input)
    if (!updated) throw new NotFoundError('Prompt')

    // Handle media replacement if mediaIds provided
    if (input.mediaIds !== undefined) {
      // Unlink existing media
      await this.mediaRepository.unlinkFromPrompt(id)

      // Attach new media
      for (let i = 0; i < input.mediaIds.length; i++) {
        const existingMedia = await this.mediaRepository.findById(input.mediaIds[i]!)
        if (existingMedia) {
          await this.mediaRepository.delete(existingMedia.id)
          await this.mediaRepository.create({
            promptId: id,
            url: existingMedia.url,
            mediaType: existingMedia.mediaType,
            sortOrder: i,
          })
        }
      }
    }

    const detail = await this.promptRepository.getDetail(id)
    if (!detail) throw new NotFoundError('Prompt')
    return detail
  }

  async delete(id: string, userId: string): Promise<void> {
    const existing = await this.promptRepository.findById(id)
    if (!existing) throw new NotFoundError('Prompt')
    if (existing.creatorId !== userId) {
      throw new ForbiddenError('You can only delete your own prompts')
    }

    await this.promptRepository.delete(id)
    // Media is cascade-deleted by D1 foreign key
  }
}
