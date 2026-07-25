import { Hono } from 'hono'
import { describeRoute, resolver, validator } from 'hono-openapi'
import { authMiddleware, requireRole } from '../middleware/auth-middleware'
import {
  createPromptSchema,
  errorResponseSchema,
  idParamSchema,
  listPromptsQuerySchema,
  myPromptsQuerySchema,
  promptDetailResponseSchema,
  promptListResponseSchema,
  successResponseSchema,
  updatePromptSchema,
} from '../schemas/prompt-schemas'
import type { AppEnv } from '../types'

const jsonContent = (schema: Parameters<typeof resolver>[0]) => ({
  'application/json': { schema: resolver(schema) },
})

export function createPromptRouter() {
  const router = new Hono<AppEnv>()

  // ── POST /prompts — Create prompt (creator only) ──────
  router.post(
    '/',
    describeRoute({
      tags: ['Prompts'],
      summary: 'Create a new prompt',
      description: 'Requires creator role.',
      responses: {
        201: { description: 'Prompt created', content: jsonContent(promptDetailResponseSchema) },
        400: { description: 'Validation error', content: jsonContent(errorResponseSchema) },
        401: { description: 'Unauthorized', content: jsonContent(errorResponseSchema) },
        403: { description: 'Forbidden (not a creator)', content: jsonContent(errorResponseSchema) },
      },
    }),
    authMiddleware,
    requireRole('creator'),
    validator('json', createPromptSchema),
    (c) => c.get('container').promptHandler.create(c)
  )

  // ── GET /prompts — List published (public) ────────────
  router.get(
    '/',
    describeRoute({
      tags: ['Prompts'],
      summary: 'List published prompts',
      description: 'Public endpoint. Only returns published prompts with optional filters.',
      responses: {
        200: { description: 'Prompts list', content: jsonContent(promptListResponseSchema) },
        400: { description: 'Invalid query params', content: jsonContent(errorResponseSchema) },
      },
    }),
    validator('query', listPromptsQuerySchema),
    (c) => c.get('container').promptHandler.listPublished(c)
  )

  // ── GET /prompts/mine — My prompts (creator only) ─────
  router.get(
    '/mine',
    describeRoute({
      tags: ['Prompts'],
      summary: 'List my prompts',
      description: 'Returns all prompts owned by the authenticated creator.',
      responses: {
        200: { description: 'My prompts list', content: jsonContent(promptListResponseSchema) },
        401: { description: 'Unauthorized', content: jsonContent(errorResponseSchema) },
        403: { description: 'Forbidden (not a creator)', content: jsonContent(errorResponseSchema) },
      },
    }),
    authMiddleware,
    requireRole('creator'),
    validator('query', myPromptsQuerySchema),
    (c) => c.get('container').promptHandler.listMine(c)
  )

  // ── GET /prompts/:id — Prompt detail (public) ────────
  router.get(
    '/:id',
    describeRoute({
      tags: ['Prompts'],
      summary: 'Get prompt detail',
      description: 'Returns full prompt detail. Draft/archived prompts are accessible only by the owner.',
      responses: {
        200: { description: 'Prompt detail', content: jsonContent(promptDetailResponseSchema) },
        403: { description: 'Forbidden (draft and not owner)', content: jsonContent(errorResponseSchema) },
        404: { description: 'Not found', content: jsonContent(errorResponseSchema) },
      },
    }),
    validator('param', idParamSchema),
    (c) => c.get('container').promptHandler.getById(c)
  )

  // ── PATCH /prompts/:id — Update prompt (owner only) ──
  router.patch(
    '/:id',
    describeRoute({
      tags: ['Prompts'],
      summary: 'Update prompt',
      description: 'Partial update. Only the creator can update their own prompts.',
      responses: {
        200: { description: 'Prompt updated', content: jsonContent(promptDetailResponseSchema) },
        400: { description: 'Validation error', content: jsonContent(errorResponseSchema) },
        401: { description: 'Unauthorized', content: jsonContent(errorResponseSchema) },
        403: { description: 'Forbidden (not creator)', content: jsonContent(errorResponseSchema) },
        404: { description: 'Not found', content: jsonContent(errorResponseSchema) },
      },
    }),
    authMiddleware,
    requireRole('creator'),
    validator('param', idParamSchema),
    validator('json', updatePromptSchema),
    (c) => c.get('container').promptHandler.update(c)
  )

  // ── DELETE /prompts/:id — Delete prompt (owner only) ──
  router.delete(
    '/:id',
    describeRoute({
      tags: ['Prompts'],
      summary: 'Delete prompt',
      description: 'Only the creator can delete their own prompts. Cascades to media.',
      responses: {
        200: { description: 'Prompt deleted', content: jsonContent(successResponseSchema) },
        401: { description: 'Unauthorized', content: jsonContent(errorResponseSchema) },
        403: { description: 'Forbidden (not creator)', content: jsonContent(errorResponseSchema) },
        404: { description: 'Not found', content: jsonContent(errorResponseSchema) },
      },
    }),
    authMiddleware,
    requireRole('creator'),
    validator('param', idParamSchema),
    (c) => c.get('container').promptHandler.delete(c)
  )

  return router
}
