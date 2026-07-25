import z from 'zod'

// HTTP contract schemas — used by routers for validation (hono-openapi
// validator) and OpenAPI spec generation.

// Note: passwordHash is excluded from API responses
export const userResponseSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  displayName: z.string(),
  avatarUrl: z.string().nullable(),
  bio: z.string().nullable(),
  role: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
})

export const updateUserSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(1).optional(),
  displayName: z.string().min(1).optional(),
  avatarUrl: z.string().optional(),
  bio: z.string().optional(),
})

export const idParamSchema = z.object({
  id: z.string().min(1),
})

export const userListResponseSchema = z.object({ data: z.array(userResponseSchema) })

export const errorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
})
