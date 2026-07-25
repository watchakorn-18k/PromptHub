import type { Context } from 'hono'
import type { UpdatePromptInput } from '../domain/entities/prompt'
import { ValidationError } from '../domain/errors'
import type { PromptService } from '../services/prompt-service'

export class PromptHandler {
  constructor(
    private readonly promptService: PromptService
  ) {}

  create = async (c: Context) => {
    const body = await c.req.json()
    const userId = c.get('user').sub

    const result = await this.promptService.create(body, userId)
    return c.json({ data: result }, 201)
  }

  listPublished = async (c: Context) => {
    const query = c.req.query()
    const filter = {
      modelType: query['modelType'] as 'mj' | 'chatgpt' | 'sora' | undefined,
      search: query['search'],
      minPrice: query['minPrice'] ? Number(query['minPrice']) : undefined,
      maxPrice: query['maxPrice'] ? Number(query['maxPrice']) : undefined,
      sort: (query['sort'] ?? 'newest') as 'newest' | 'oldest' | 'price_asc' | 'price_desc',
      cursor: query['cursor'],
      limit: query['limit'] ? Number(query['limit']) : 20,
    }

    const result = await this.promptService.listPublished(filter)
    return c.json(result)
  }

  listMine = async (c: Context) => {
    const userId = c.get('user').sub
    const query = c.req.query()
    const filter = {
      status: query['status'] as 'draft' | 'published' | 'archived' | undefined,
      sort: (query['sort'] ?? 'newest') as 'newest' | 'oldest',
      cursor: query['cursor'],
      limit: query['limit'] ? Number(query['limit']) : 20,
    }

    const result = await this.promptService.findByCreator(userId, filter)
    return c.json(result)
  }

  getById = async (c: Context) => {
    const id = c.req.param('id')
    if (!id) throw new ValidationError('id param is required')
    const user = c.get('user') as { sub: string } | undefined
    const userId = user?.sub

    const result = await this.promptService.getDetail(id, userId)
    return c.json({ data: result })
  }

  update = async (c: Context) => {
    const id = c.req.param('id')
    if (!id) throw new ValidationError('id param is required')
    const userPayload = c.get('user') as { sub: string }
    const userId = userPayload.sub
    const body = await this.parseJson<UpdatePromptInput>(c)

    const result = await this.promptService.update(id, body, userId)
    return c.json({ data: result })
  }

  delete = async (c: Context) => {
    const id = c.req.param('id')
    if (!id) throw new ValidationError('id param is required')
    const userPayload = c.get('user') as { sub: string }
    const userId = userPayload.sub

    await this.promptService.delete(id, userId)
    return c.json({ success: true })
  }

  private async parseJson<T>(c: Context): Promise<T> {
    try {
      return await c.req.json<T>()
    } catch {
      throw new ValidationError('Invalid JSON body')
    }
  }
}
