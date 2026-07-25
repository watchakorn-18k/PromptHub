
import type {
  CreatePromptInput,
  PaginatedResult,
  Prompt,
  PromptDetail,
  PromptFilter,
  PromptListItem,
  UpdatePromptInput,
} from '../../domain/entities/prompt'
import type { MediaRepository } from '../../domain/repositories/media-repository'
import type { PromptRepository } from '../../domain/repositories/prompt-repository'

// ─── Row types (snake_case from DB) ──────────────────────

interface PromptRow {
  id: string
  creator_id: string
  title: string
  description: string
  price: number
  model_type: string
  parameters: string
  content: string
  status: string
  created_at: string
  updated_at: string
}

interface UserRow {
  id: string
  display_name: string
  avatar_url: string | null
}

interface PromptWithCreatorRow extends PromptRow {
  creator_display_name: string
  creator_avatar_url: string | null
}

// ─── Mapping helpers ─────────────────────────────────────

function toPrompt(row: PromptRow): Prompt {
  return {
    id: row.id,
    creatorId: row.creator_id,
    title: row.title,
    description: row.description,
    price: row.price,
    modelType: row.model_type as Prompt['modelType'],
    parameters: safeParseJson(row.parameters),
    content: row.content,
    status: row.status as Prompt['status'],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toListItem(
  row: PromptWithCreatorRow,
  previewMedia: PromptListItem['previewMedia']
): PromptListItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    price: row.price,
    modelType: row.model_type as PromptListItem['modelType'],
    status: row.status as PromptListItem['status'],
    previewMedia,
    creator: {
      id: row.creator_id,
      displayName: row.creator_display_name,
      avatarUrl: row.creator_avatar_url ?? undefined,
    },
    createdAt: row.created_at,
  }
}

function safeParseJson(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw) as Record<string, unknown>
  } catch {
    return {}
  }
}

// ─── SQL fragments ───────────────────────────────────────

const PROMPT_SELECT =
  'id, creator_id, title, description, price, model_type, parameters, content, status, created_at, updated_at'

const LIST_WITH_CREATOR_SELECT = `
  p.id, p.creator_id, p.title, p.description, p.price,
  p.model_type, p.parameters, p.content, p.status, p.created_at, p.updated_at,
  u.display_name AS creator_display_name, u.avatar_url AS creator_avatar_url
`

const LIST_FROM = 'prompts p JOIN users u ON p.creator_id = u.id'

// ─── Pagination helper ───────────────────────────────────

function buildCursorConditions(
  sort: NonNullable<PromptFilter['sort']>,
  cursor?: string
): { orderClause: string; cursorClause: string; cursorParam: string | null } {
  switch (sort) {
    case 'newest':
      return {
        orderClause: 'p.created_at DESC, p.id DESC',
        cursorClause: cursor ? '(p.created_at, p.id) < (SELECT created_at, id FROM prompts WHERE id = ?)' : '',
        cursorParam: cursor ?? null,
      }
    case 'oldest':
      return {
        orderClause: 'p.created_at ASC, p.id ASC',
        cursorClause: cursor ? '(p.created_at, p.id) > (SELECT created_at, id FROM prompts WHERE id = ?)' : '',
        cursorParam: cursor ?? null,
      }
    case 'price_asc':
      return {
        orderClause: 'p.price ASC, p.id ASC',
        cursorClause: cursor ? '(p.price, p.id) > (SELECT price, id FROM prompts WHERE id = ?)' : '',
        cursorParam: cursor ?? null,
      }
    case 'price_desc':
      return {
        orderClause: 'p.price DESC, p.id DESC',
        cursorClause: cursor ? '(p.price, p.id) < (SELECT price, id FROM prompts WHERE id = ?)' : '',
        cursorParam: cursor ?? null,
      }
  }
}

// ─── Repository class ────────────────────────────────────

export class D1PromptRepository implements PromptRepository {
  constructor(
    private readonly db: D1Database,
    private readonly mediaRepository?: MediaRepository
  ) {}

  async create(input: CreatePromptInput & { creatorId: string }): Promise<Prompt> {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    const paramsJson = JSON.stringify(input.parameters ?? {})

    await this.db
      .prepare(
        `INSERT INTO prompts (id, creator_id, title, description, price, model_type, parameters, content, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id,
        input.creatorId,
        input.title,
        input.description ?? '',
        input.price,
        input.modelType,
        paramsJson,
        input.content,
        input.status ?? 'draft',
        now,
        now
      )
      .run()

    return {
      id,
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
  }

  async findById(id: string): Promise<Prompt | null> {
    const row = await this.db
      .prepare(`SELECT ${PROMPT_SELECT} FROM prompts WHERE id = ?`)
      .bind(id)
      .first<PromptRow>()
    return row ? toPrompt(row) : null
  }

  async findByCreatorId(
    creatorId: string,
    filter: PromptFilter
  ): Promise<PaginatedResult<PromptListItem>> {
    const conditions: string[] = ['p.creator_id = ?']
    const params: unknown[] = [creatorId]

    if (filter.status) {
      conditions.push('p.status = ?')
      params.push(filter.status)
    }

    return this.listWithConditions(conditions, params, filter)
  }

  async listPublished(filter: PromptFilter): Promise<PaginatedResult<PromptListItem>> {
    const conditions: string[] = ['p.status = ?']
    const params: unknown[] = ['published']

    if (filter.modelType) {
      conditions.push('p.model_type = ?')
      params.push(filter.modelType)
    }

    if (filter.search) {
      conditions.push('(p.title LIKE ? OR p.description LIKE ?)')
      const pattern = `%${filter.search}%`
      params.push(pattern, pattern)
    }

    if (filter.minPrice !== undefined) {
      conditions.push('p.price >= ?')
      params.push(filter.minPrice)
    }

    if (filter.maxPrice !== undefined) {
      conditions.push('p.price <= ?')
      params.push(filter.maxPrice)
    }

    return this.listWithConditions(conditions, params, filter)
  }

  private async listWithConditions(
    conditions: string[],
    params: unknown[],
    filter: PromptFilter
  ): Promise<PaginatedResult<PromptListItem>> {
    const sort = filter.sort ?? 'newest'
    const limit = filter.limit ?? 20
    const cursor = filter.cursor

    const { orderClause, cursorClause, cursorParam } = buildCursorConditions(sort, cursor)

    if (cursorClause) {
      conditions.push(cursorClause)
      params.push(cursorParam)
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const sql = `
      SELECT ${LIST_WITH_CREATOR_SELECT}
      FROM ${LIST_FROM}
      ${where}
      ORDER BY ${orderClause}
      LIMIT ?
    `
    params.push(limit + 1) // fetch one extra to know if hasMore

    const { results } = await this.db.prepare(sql).bind(...params).all<PromptWithCreatorRow>()

    const hasMore = results.length > limit
    const rows = hasMore ? results.slice(0, limit) : results

    // Fetch preview media for each prompt (first media by sort_order)
    const promptIds = rows.map((r) => r.id)
    const previewMediaMap = await this.fetchPreviewMedia(promptIds)

    const data = rows.map((row) =>
      toListItem(row, previewMediaMap.get(row.id) ?? [])
    )

    const lastItem = data[data.length - 1]
    return {
      data,
      pagination: {
        cursor: lastItem ? lastItem.id : null,
        hasMore,
      },
    }
  }

  private async fetchPreviewMedia(
    promptIds: string[]
  ): Promise<Map<string, PromptListItem['previewMedia']>> {
    if (promptIds.length === 0) return new Map()

    const placeholders = promptIds.map(() => '?').join(',')
    const { results } = await this.db
      .prepare(
        `SELECT id, prompt_id, url, media_type, sort_order, created_at
         FROM prompt_media
         WHERE prompt_id IN (${placeholders})
         ORDER BY sort_order ASC`
      )
      .bind(...promptIds)
      .all<{
        id: string
        prompt_id: string
        url: string
        media_type: string
        sort_order: number
        created_at: string
      }>()

    const map = new Map<string, PromptListItem['previewMedia']>()
    for (const row of results) {
      const media = {
        id: row.id,
        promptId: row.prompt_id,
        url: row.url,
        mediaType: row.media_type as 'image' | 'video',
        sortOrder: row.sort_order,
        createdAt: row.created_at,
      }
      const existing = map.get(row.prompt_id)
      if (existing) {
        existing.push(media)
      } else {
        map.set(row.prompt_id, [media])
      }
    }
    return map
  }

  async getDetail(id: string): Promise<PromptDetail | null> {
    const row = await this.db
      .prepare(
        `SELECT ${LIST_WITH_CREATOR_SELECT}
         FROM ${LIST_FROM}
         WHERE p.id = ?`
      )
      .bind(id)
      .first<PromptWithCreatorRow>()

    if (!row) return null

    // Fetch all media for this prompt
    const { results: mediaRows } = await this.db
      .prepare(
        `SELECT id, prompt_id, url, media_type, sort_order, created_at
         FROM prompt_media
         WHERE prompt_id = ?
         ORDER BY sort_order ASC`
      )
      .bind(id)
      .all<{
        id: string
        prompt_id: string
        url: string
        media_type: string
        sort_order: number
        created_at: string
      }>()

    const media = mediaRows.map((r) => ({
      id: r.id,
      promptId: r.prompt_id,
      url: r.url,
      mediaType: r.media_type as 'image' | 'video',
      sortOrder: r.sort_order,
      createdAt: r.created_at,
    }))

    return {
      id: row.id,
      title: row.title,
      description: row.description,
      price: row.price,
      modelType: row.model_type as PromptDetail['modelType'],
      status: row.status as PromptDetail['status'],
      parameters: safeParseJson(row.parameters),
      content: row.content,
      media,
      previewMedia: media.slice(0, 1), // first media as preview
      creator: {
        id: row.creator_id,
        displayName: row.creator_display_name,
        avatarUrl: row.creator_avatar_url ?? undefined,
      },
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }

  async update(id: string, input: UpdatePromptInput): Promise<Prompt | null> {
    const existing = await this.findById(id)
    if (!existing) return null

    const sets: string[] = []
    const values: unknown[] = []

    if (input.title !== undefined) {
      sets.push('title = ?')
      values.push(input.title)
    }
    if (input.description !== undefined) {
      sets.push('description = ?')
      values.push(input.description)
    }
    if (input.price !== undefined) {
      sets.push('price = ?')
      values.push(input.price)
    }
    if (input.modelType !== undefined) {
      sets.push('model_type = ?')
      values.push(input.modelType)
    }
    if (input.parameters !== undefined) {
      sets.push('parameters = ?')
      values.push(JSON.stringify(input.parameters))
    }
    if (input.content !== undefined) {
      sets.push('content = ?')
      values.push(input.content)
    }
    if (input.status !== undefined) {
      sets.push('status = ?')
      values.push(input.status)
    }

    if (sets.length === 0) return existing

    const updatedAt = new Date().toISOString()
    sets.push('updated_at = ?')
    values.push(updatedAt)
    values.push(id)

    await this.db
      .prepare(`UPDATE prompts SET ${sets.join(', ')} WHERE id = ?`)
      .bind(...values)
      .run()

    const updated = await this.findById(id)
    return updated
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.prepare('DELETE FROM prompts WHERE id = ?').bind(id).run()
    return result.meta.changes > 0
  }
}
