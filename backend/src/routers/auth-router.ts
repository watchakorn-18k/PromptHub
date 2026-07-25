import { Hono } from 'hono'
import { describeRoute, resolver, validator } from 'hono-openapi'
import { authMiddleware } from '../middleware/auth-middleware'
import {
  authResponseSchema,
  errorResponseSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
  updateProfileSchema,
  userPublicSchema,
} from '../schemas/auth-schemas'
import type { AppEnv } from '../types'

const jsonContent = (schema: Parameters<typeof resolver>[0]) => ({
  'application/json': { schema: resolver(schema) },
})

export function createAuthRouter() {
  const router = new Hono<AppEnv>()

  router.post(
    '/register',
    describeRoute({
      tags: ['Auth'],
      summary: 'Register a new user',
      responses: {
        201: { description: 'User registered', content: jsonContent(authResponseSchema) },
        400: { description: 'Invalid input', content: jsonContent(errorResponseSchema) },
        409: { description: 'Email already registered', content: jsonContent(errorResponseSchema) },
      },
    }),
    validator('json', registerSchema),
    (c) => c.get('container').authHandler.register(c)
  )

  router.post(
    '/login',
    describeRoute({
      tags: ['Auth'],
      summary: 'Login',
      responses: {
        200: { description: 'Login successful', content: jsonContent(authResponseSchema) },
        401: { description: 'Invalid credentials', content: jsonContent(errorResponseSchema) },
      },
    }),
    validator('json', loginSchema),
    (c) => c.get('container').authHandler.login(c)
  )

  router.get(
    '/me',
    describeRoute({
      tags: ['Auth'],
      summary: 'Get current user profile',
      responses: {
        200: { description: 'User profile', content: jsonContent(userPublicSchema) },
        401: { description: 'Unauthorized', content: jsonContent(errorResponseSchema) },
      },
    }),
    authMiddleware,
    (c) => c.get('container').authHandler.me(c)
  )

  router.patch(
    '/me',
    describeRoute({
      tags: ['Auth'],
      summary: 'Update current user profile',
      responses: {
        200: { description: 'Profile updated', content: jsonContent(userPublicSchema) },
        401: { description: 'Unauthorized', content: jsonContent(errorResponseSchema) },
      },
    }),
    authMiddleware,
    validator('json', updateProfileSchema),
    (c) => c.get('container').authHandler.updateProfile(c)
  )

  return router
}
