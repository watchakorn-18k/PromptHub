export type ModelType = 'mj' | 'chatgpt' | 'sora'
export type PromptStatus = 'draft' | 'published' | 'archived'
export type MediaType = 'image' | 'video'

export interface Prompt {
  id: string
  creatorId: string
  title: string
  description: string
  price: number        // integer satang (THB × 100)
  modelType: ModelType
  parameters: Record<string, unknown>
  content: string
  status: PromptStatus
  createdAt: string
  updatedAt: string
}

export interface PromptMedia {
  id: string
  promptId: string
  url: string
  mediaType: MediaType
  sortOrder: number
  createdAt: string
}

// API response types

export interface PromptListItem {
  id: string
  title: string
  description: string
  price: number
  modelType: ModelType
  status: PromptStatus
  previewMedia: PromptMedia[]
  creator: {
    id: string
    displayName: string
    avatarUrl?: string
  }
  createdAt: string
}

export interface PromptDetail extends PromptListItem {
  parameters: Record<string, unknown>
  content: string
  media: PromptMedia[]
  updatedAt: string
}

// API input types

export interface CreatePromptInput {
  title: string
  description?: string
  price: number
  modelType: ModelType
  parameters: Record<string, unknown>
  content: string
  status?: PromptStatus
  mediaIds?: string[]
}

export interface UpdatePromptInput {
  title?: string
  description?: string
  price?: number
  modelType?: ModelType
  parameters?: Record<string, unknown>
  content?: string
  status?: PromptStatus
  mediaIds?: string[]
}

export interface PromptFilter {
  modelType?: ModelType
  status?: PromptStatus
  search?: string
  minPrice?: number
  maxPrice?: number
  sort?: 'newest' | 'oldest' | 'price_asc' | 'price_desc'
  cursor?: string
  limit?: number
}

export interface PaginatedResult<T> {
  data: T[]
  pagination: {
    cursor: string | null
    hasMore: boolean
  }
}
