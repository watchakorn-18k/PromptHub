import type { Context } from 'hono'
import { ValidationError } from '../domain/errors'
import type { MediaService } from '../services/media-service'

export class MediaHandler {
  constructor(private readonly mediaService: MediaService) {}

  upload = async (c: Context) => {
    const fd = await c.req.formData()
    const file = fd.get('file') as File | null
    const mediaTypeRaw = fd.get('mediaType') as string | null

    if (!file) {
      throw new ValidationError('File is required')
    }

    if (!mediaTypeRaw || !['image', 'video'].includes(mediaTypeRaw)) {
      throw new ValidationError('mediaType must be "image" or "video"')
    }

    const mediaType = mediaTypeRaw as 'image' | 'video'
    const result = await this.mediaService.upload(file, mediaType)
    return c.json({ data: result }, 201)
  }
}
