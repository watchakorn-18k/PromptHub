import z from 'zod'

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  displayName: z.string().min(1).optional(),
  role: z.enum(['creator', 'buyer']).optional().default('buyer'),
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
})

export const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  displayName: z.string().min(1).optional(),
  avatarUrl: z.string().url().optional(),
  bio: z.string().optional(),
})

export const userPublicSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  displayName: z.string(),
  avatarUrl: z.string().nullable(),
  bio: z.string().nullable(),
  role: z.enum(['admin', 'creator', 'buyer']),
  createdAt: z.string(),
})

export const authResponseSchema = z.object({
  user: userPublicSchema,
  accessToken: z.string(),
  refreshToken: z.string(),
})

export const errorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
})
