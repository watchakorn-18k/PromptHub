import { Hono } from 'hono'
import { describeRoute, resolver } from 'hono-openapi'
import { authMiddleware, requireRole } from '../middleware/auth-middleware'
import { errorResponseSchema, mediaResponseSchema } from '../schemas/prompt-schemas'
import type { AppEnv } from '../types'

const jsonContent = (schema: Parameters<typeof resolver>[0]) => ({
  'application/json': { schema: resolver(schema) },
})

export function createMediaRouter() {
  const router = new Hono<AppEnv>()

  // ── POST /media/upload — Upload media file (creator only) ──
  router.post(
    '/upload',
    describeRoute({
      tags: ['Media'],
      summary: 'Upload media file',
      description: 'Upload an image or video file. Returns media object that can be referenced in prompt creation.',
      responses: {
        201: { description: 'Media uploaded', content: jsonContent(mediaResponseSchema) },
        400: { description: 'Invalid file type or missing file', content: jsonContent(errorResponseSchema) },
        401: { description: 'Unauthorized', content: jsonContent(errorResponseSchema) },
        403: { description: 'Forbidden (not a creator)', content: jsonContent(errorResponseSchema) },
        413: { description: 'File too large', content: jsonContent(errorResponseSchema) },
      },
    }),
    authMiddleware,
    requireRole('creator'),
    (c) => c.get('container').mediaHandler.upload(c)
  )

  return router
}
