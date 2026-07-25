import { z } from 'zod'

// ─── Enum values ──────────────────────────────────────────

const modelTypeSchema = z.enum(['mj', 'chatgpt', 'sora'])
const promptStatusSchema = z.enum(['draft', 'published', 'archived'])
const mediaTypeSchema = z.enum(['image', 'video'])
const sortSchema = z.enum(['newest', 'oldest', 'price_asc', 'price_desc'])
const mySortSchema = z.enum(['newest', 'oldest'])

// ─── Parameters schema (permissive — validated by frontend) ──

const parametersSchema = z.record(z.string(), z.unknown()).default({})

// ─── Create / Update input ────────────────────────────────

export const createPromptSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional().default(''),
  price: z.number().int().min(0, 'Price must be non-negative'),
  modelType: modelTypeSchema,
  parameters: parametersSchema,
  content: z.string().min(1, 'Content is required'),
  status: promptStatusSchema.optional().default('draft'),
  mediaIds: z.array(z.string().min(1)).max(20).optional(),
})

export const updatePromptSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  price: z.number().int().min(0).optional(),
  modelType: modelTypeSchema.optional(),
  parameters: parametersSchema.optional(),
  content: z.string().min(1).optional(),
  status: promptStatusSchema.optional(),
  mediaIds: z.array(z.string().min(1)).max(20).optional(),
})

// ─── Query parameter schemas ──────────────────────────────

export const listPromptsQuerySchema = z.object({
  modelType: modelTypeSchema.optional(),
  search: z.string().max(200).optional(),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  sort: sortSchema.optional().default('newest'),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
})

export const myPromptsQuerySchema = z.object({
  status: promptStatusSchema.optional(),
  sort: mySortSchema.optional().default('newest'),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
})

// ─── ID param schema ─────────────────────────────────────

export const idParamSchema = z.object({
  id: z.string().min(1),
})

// ─── Media upload ────────────────────────────────────────

export const mediaUploadSchema = z.object({
  mediaType: mediaTypeSchema,
})

// Allowed MIME types for media upload
export const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const
export const ALLOWED_VIDEO_MIMES = ['video/mp4', 'video/webm'] as const
export const ALLOWED_MIMES = new Set([...ALLOWED_IMAGE_MIMES, ...ALLOWED_VIDEO_MIMES])
export const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

// ─── API response schemas (for OpenAPI docs) ──────────────

export const promptMediaSchema = z.object({
  id: z.string(),
  promptId: z.string(),
  url: z.string(),
  mediaType: mediaTypeSchema,
  sortOrder: z.number().int(),
  createdAt: z.string(),
})

export const creatorInfoSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  avatarUrl: z.string().optional(),
})

export const promptListItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  price: z.number().int(),
  modelType: modelTypeSchema,
  status: promptStatusSchema,
  previewMedia: z.array(promptMediaSchema),
  creator: creatorInfoSchema,
  createdAt: z.string(),
})

export const promptDetailSchema = promptListItemSchema.extend({
  parameters: z.record(z.string(), z.unknown()),
  content: z.string(),
  media: z.array(promptMediaSchema),
  updatedAt: z.string(),
})

export const paginationSchema = z.object({
  cursor: z.string().nullable(),
  hasMore: z.boolean(),
})

export const promptListResponseSchema = z.object({
  data: z.array(promptListItemSchema),
  pagination: paginationSchema,
})

export const promptDetailResponseSchema = z.object({
  data: promptDetailSchema,
})

export const mediaResponseSchema = z.object({
  data: promptMediaSchema,
})

export const successResponseSchema = z.object({
  success: z.literal(true),
})

export const errorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
})
