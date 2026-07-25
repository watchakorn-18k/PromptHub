
import { ValidationError } from '../../domain/errors'
import { ALLOWED_MIMES, MAX_FILE_SIZE } from '../../schemas/prompt-schemas'

export interface MediaStorageResult {
  url: string
}

export interface MediaStorage {
  upload(file: File, mediaType: 'image' | 'video'): Promise<MediaStorageResult>
  delete(key: string): Promise<void>
}

/**
 * R2 media storage implementation.
 * Falls back to a fake URL for Phase 2 MVP when R2_BUCKET is not configured.
 */
export class R2MediaStorage implements MediaStorage {
  constructor(
    private readonly bucket: R2Bucket | undefined,
    private readonly publicUrlBase?: string
  ) {}

  /**
   * Upload a file to R2.
   * Returns the public URL or a fake URL for development.
   */
  async upload(
    file: File,
    mediaType: 'image' | 'video'
  ): Promise<MediaStorageResult> {
    this.validateFile(file)

    const ext = this.getExtension(file.type)
    const key = `prompts/${crypto.randomUUID()}${ext}`

    // If R2 is not configured, return a fake URL for Phase 2 MVP
    if (!this.bucket) {
      return {
        url: `https://media.prompthub.dev/${key}`,
      }
    }

    const arrayBuffer = await file.arrayBuffer()
    await this.bucket.put(key, arrayBuffer, {
      httpMetadata: { contentType: file.type },
      customMetadata: { mediaType },
    })

    const url = this.publicUrlBase
      ? `${this.publicUrlBase}/${key}`
      : `https://r2.prompthub.dev/${key}`

    return { url }
  }

  async delete(key: string): Promise<void> {
    if (!this.bucket) return
    await this.bucket.delete(key)
  }

  private validateFile(file: File): void {
    if (!file) {
      throw new ValidationError('File is required')
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new ValidationError(`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`)
    }

    // Cast to Set<string> for broader string compatibility
    if (!(ALLOWED_MIMES as Set<string>).has(file.type)) {
      throw new ValidationError(
        `Invalid file type: ${file.type}. Allowed: ${Array.from(ALLOWED_MIMES).join(', ')}`
      )
    }
  }

  private getExtension(type: string): string {
    const exts: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif',
      'video/mp4': '.mp4',
      'video/webm': '.webm',
    }
    return (exts as Record<string, string>)[type] ?? '.bin'
  }

  /**
   * Extract the key from a storage URL so we can delete it.
   */
  keyFromUrl(url: string): string | null {
    const base = this.publicUrlBase ?? 'https://r2.prompthub.dev'
    if (url.startsWith(base)) {
      return url.slice(base.length + 1) // +1 for '/'
    }
    // For dev URLs
    const devBase = 'https://media.prompthub.dev'
    if (url.startsWith(devBase)) {
      return url.slice(devBase.length + 1)
    }
    return null
  }
}
