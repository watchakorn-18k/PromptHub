
import type { PromptMedia } from '../../domain/entities/prompt'
import type { CreateMediaData, MediaRepository } from '../../domain/repositories/media-repository'

interface MediaRow {
  id: string
  prompt_id: string | null
  url: string
  media_type: string
  sort_order: number
  created_at: string
}

function toMedia(row: MediaRow): PromptMedia {
  return {
    id: row.id,
    promptId: row.prompt_id ?? '',
    url: row.url,
    mediaType: row.media_type as 'image' | 'video',
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  }
}

export class D1MediaRepository implements MediaRepository {
  constructor(private readonly db: D1Database) {}

  async create(data: CreateMediaData): Promise<PromptMedia> {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()

    await this.db
      .prepare(
        `INSERT INTO prompt_media (id, prompt_id, url, media_type, sort_order, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .bind(id, data.promptId ?? null, data.url, data.mediaType, data.sortOrder, now)
      .run()

    return {
      id,
      promptId: data.promptId ?? '',
      url: data.url,
      mediaType: data.mediaType,
      sortOrder: data.sortOrder,
      createdAt: now,
    }
  }

  async bulkCreate(data: CreateMediaData[]): Promise<PromptMedia[]> {
    if (data.length === 0) return []
    const results: PromptMedia[] = []
    const now = new Date().toISOString()

    const stmt = this.db.prepare(
      `INSERT INTO prompt_media (id, prompt_id, url, media_type, sort_order, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )

    for (const item of data) {
      const id = crypto.randomUUID()
      results.push({
        id,
        promptId: item.promptId ?? '',
        url: item.url,
        mediaType: item.mediaType,
        sortOrder: item.sortOrder,
        createdAt: now,
      })
    }

    // Batch insert
    await this.db.batch(
      results.map((r, i) =>
        stmt.bind(r.id, data[i]!.promptId ?? null, r.url, data[i]!.mediaType, data[i]!.sortOrder, now)
      )
    )

    return results
  }

  async findByPromptId(promptId: string): Promise<PromptMedia[]> {
    const { results } = await this.db
      .prepare(
        `SELECT id, prompt_id, url, media_type, sort_order, created_at
         FROM prompt_media
         WHERE prompt_id = ?
         ORDER BY sort_order ASC`
      )
      .bind(promptId)
      .all<MediaRow>()

    return results.map(toMedia)
  }

  async findById(id: string): Promise<PromptMedia | null> {
    const row = await this.db
      .prepare(
        `SELECT id, prompt_id, url, media_type, sort_order, created_at
         FROM prompt_media
         WHERE id = ?`
      )
      .bind(id)
      .first<MediaRow>()

    return row ? toMedia(row) : null
  }

  async unlinkFromPrompt(promptId: string): Promise<void> {
    await this.db
      .prepare('UPDATE prompt_media SET prompt_id = NULL WHERE prompt_id = ?')
      .bind(promptId)
      .run()
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.prepare('DELETE FROM prompt_media WHERE id = ?').bind(id).run()
    return result.meta.changes > 0
  }
}
