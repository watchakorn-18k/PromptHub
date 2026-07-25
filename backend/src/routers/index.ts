import { Hono } from 'hono'
import type { AppEnv } from '../types'
import { createAuthRouter } from './auth-router'
import { createUserRouter } from './user-router'
import { createPromptRouter } from './prompt-router'
import { createMediaRouter } from './media-router'

export function createApiRouter() {
  const api = new Hono<AppEnv>()

  api.route('/auth', createAuthRouter())
  api.route('/users', createUserRouter())
  api.route('/prompts', createPromptRouter())
  api.route('/media', createMediaRouter())

  return api
}
