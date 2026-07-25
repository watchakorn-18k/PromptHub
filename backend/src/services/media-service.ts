import type { PromptMedia } from '../domain/entities/prompt'
import type { MediaRepository } from '../domain/repositories/media-repository'
import type { MediaStorage } from '../infrastructure/r2/r2-media-storage'

export class MediaService {
  constructor(
    private readonly mediaRepository: MediaRepository,
    private readonly storage: MediaStorage
  ) {}

  async upload(
    file: File,
    mediaType: 'image' | 'video'
  ): Promise<PromptMedia> {
    const { url } = await this.storage.upload(file, mediaType)
    return this.mediaRepository.create({
      url,
      mediaType,
      sortOrder: 0,
    })
  }
}
