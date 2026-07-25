export type ModelType = 'mj' | 'chatgpt' | 'sora'
export type PromptStatus = 'draft' | 'published' | 'archived'
export type MediaType = 'image' | 'video'
export type PromptSort = 'newest' | 'oldest' | 'price_asc' | 'price_desc'

export interface Prompt {
  id: string
  creatorId: string
  title: string
  description: string
  price: number        // integer satang (THB × 100)
  modelType: ModelType
  parameters: Record<string, unknown>  // JSON
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

// API response types (includes creator info + media)
export interface PromptListItem {
  id: string
  title: string
  description: string
  price: number
  modelType: ModelType
  status: PromptStatus
  previewMedia: PromptMedia[]
  creator: { id: string; displayName: string; avatarUrl?: string }
  createdAt: string
}

export interface PromptDetail extends PromptListItem {
  parameters: Record<string, unknown>
  content: string
  media: PromptMedia[]
  updatedAt: string
}

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

export interface PromptFilters {
  modelType?: ModelType
  search?: string
  minPrice?: number
  maxPrice?: number
  sort?: PromptSort
  cursor?: string
  limit?: number
  status?: PromptStatus
}

export interface PaginationInfo {
  cursor: string
  hasMore: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: PaginationInfo
}

export interface SingleDataResponse<T> {
  data: T
}

// Parameter form field definition
export interface ParameterField {
  key: string
  label: string
  type: 'text' | 'textarea' | 'number' | 'range' | 'select' | 'boolean'
  options?: string[]
  min?: number
  max?: number
  step?: number
  defaultValue: unknown
}

// Model parameter schemas for dynamic form generation
export const modelParameterSchemas: Record<ModelType, ParameterField[]> = {
  mj: [
    { key: 'version', label: 'Version', type: 'select', options: ['5.2', '6.0', '6.1'], defaultValue: '6.1' },
    { key: 'aspectRatio', label: 'Aspect Ratio', type: 'select', options: ['1:1', '16:9', '3:4', '2:3', '4:3', '9:16', '21:9'], defaultValue: '1:1' },
    { key: 'stylize', label: 'Stylize (--s)', type: 'range', min: 0, max: 1000, step: 10, defaultValue: 100 },
    { key: 'chaos', label: 'Chaos (--c)', type: 'range', min: 0, max: 100, step: 10, defaultValue: 0 },
    { key: 'raw', label: 'Raw Mode (--style raw)', type: 'boolean', defaultValue: false },
    { key: 'no', label: 'Negative (--no)', type: 'text', defaultValue: '' },
    { key: 'tile', label: 'Tile (--tile)', type: 'boolean', defaultValue: false },
    { key: 'iw', label: 'Image Weight (--iw)', type: 'number', min: 0, max: 3, step: 0.5, defaultValue: null },
  ],
  chatgpt: [
    { key: 'system_prompt', label: 'System Prompt', type: 'textarea', defaultValue: '' },
    { key: 'temperature', label: 'Temperature', type: 'range', min: 0, max: 2, step: 0.1, defaultValue: 0.7 },
    { key: 'max_tokens', label: 'Max Tokens', type: 'number', min: 1, max: 8192, step: 1, defaultValue: 2048 },
    { key: 'top_p', label: 'Top P', type: 'range', min: 0, max: 1, step: 0.05, defaultValue: 1.0 },
    { key: 'frequency_penalty', label: 'Frequency Penalty', type: 'range', min: -2, max: 2, step: 0.1, defaultValue: 0.0 },
    { key: 'presence_penalty', label: 'Presence Penalty', type: 'range', min: -2, max: 2, step: 0.1, defaultValue: 0.0 },
  ],
  sora: [
    { key: 'duration', label: 'Duration (s)', type: 'number', min: 5, max: 60, step: 1, defaultValue: 10 },
    { key: 'resolution', label: 'Resolution', type: 'select', options: ['720p', '1080p', '4k'], defaultValue: '1080p' },
    { key: 'style', label: 'Style', type: 'select', options: ['cinematic', 'anime', 'realistic', '3d-render'], defaultValue: 'cinematic' },
    { key: 'camera_motion', label: 'Camera Motion', type: 'select', options: ['static', 'pan-left', 'pan-right', 'dolly-in', 'dolly-out', 'orbit'], defaultValue: 'static' },
    { key: 'negative_prompt', label: 'Negative Prompt', type: 'text', defaultValue: '' },
  ],
}

// Display helpers
export const modelLabels: Record<ModelType, string> = {
  mj: 'Midjourney',
  chatgpt: 'ChatGPT',
  sora: 'Sora',
}

export const modelColors: Record<ModelType, string> = {
  mj: 'success',
  chatgpt: 'info',
  sora: 'warning',
}

export const statusLabels: Record<PromptStatus, string> = {
  draft: 'Draft',
  published: 'Published',
  archived: 'Archived',
}

export const statusColors: Record<PromptStatus, string> = {
  draft: 'default',
  published: 'success',
  archived: 'secondary',
}

/**
 * Convert price from satang (backend) to THB for display
 */
export function satangToThb(satang: number): number {
  return satang / 100
}

/**
 * Convert price from THB (user input) to satang for API
 */
export function thbToSatang(thb: number): number {
  return Math.round(thb * 100)
}
