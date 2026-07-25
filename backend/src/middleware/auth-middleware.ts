import { jwtVerify } from 'jose'
import type { Context, Next } from 'hono'
import type { UserRole } from '../domain/entities/user'
import { ForbiddenError, UnauthorizedError } from '../domain/errors'
import type { AppEnv, Variables } from '../types'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'prompthub-jwt-secret-change-in-production'
)

export interface JwtPayload {
  sub: string
  role: UserRole
  iat: number
  exp: number
}

/**
 * JWT authentication middleware.
 * ต้องมี Authorization header: Bearer <token>
 * ถ้า valid → เก็บ payload ใน c.set('user', payload)
 */
export async function authMiddleware(c: Context<AppEnv>, next: Next) {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or invalid Authorization header')
  }

  const token = authHeader.slice(7)
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    const userPayload = payload as unknown as JwtPayload
    c.set('user', userPayload)
    await next()
  } catch {
    throw new UnauthorizedError('Invalid or expired token')
  }
}

/**
 * Role-based authorization middleware.
 * ใช้ต่อจาก authMiddleware — ต้องมี user payload ใน context ก่อน
 */
export function requireRole(...roles: UserRole[]) {
  return async (c: Context<AppEnv>, next: Next) => {
    const user = c.get('user') as JwtPayload | undefined
    if (!user) throw new UnauthorizedError()
    if (!roles.includes(user.role)) {
      throw new ForbiddenError('Insufficient permissions')
    }
    await next()
  }
}

// Extend hono Variables
declare module 'hono' {
  interface ContextVariableMap {
    user: JwtPayload
  }
}
