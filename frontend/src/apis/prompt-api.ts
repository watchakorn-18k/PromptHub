import { request } from './request'
import type {
  CreatePromptInput,
  PaginatedResponse,
  PromptDetail,
  PromptFilters,
  PromptListItem,
  SingleDataResponse,
  UpdatePromptInput,
} from '@/models/prompt'

const BASE = `${import.meta.env.VITE_BACKEND_URL}/api/v1`

export const promptApi = {
  /**
   * List published prompts (public)
   */
  list: (filters: PromptFilters = {}) =>
    request<PaginatedResponse<PromptListItem>>(`${BASE}/prompts`, {
      params: filters as Record<string, string>,
    }),

  /**
   * List current creator's prompts (auth required, creator role)
   */
  listMine: (filters: PromptFilters = {}) =>
    request<PaginatedResponse<PromptListItem>>(`${BASE}/prompts/mine`, {
      params: filters as Record<string, string>,
    }),

  /**
   * Get prompt detail by id
   */
  getById: (id: string) =>
    request<SingleDataResponse<PromptDetail>>(`${BASE}/prompts/${id}`),

  /**
   * Create a new prompt (auth required, creator role)
   */
  create: (body: CreatePromptInput) =>
    request<SingleDataResponse<PromptDetail>>(`${BASE}/prompts`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  /**
   * Update an existing prompt (auth required, must be creator)
   */
  update: (id: string, body: UpdatePromptInput) =>
    request<SingleDataResponse<PromptDetail>>(`${BASE}/prompts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  /**
   * Delete a prompt (auth required, must be creator)
   */
  delete: (id: string) =>
    request<{ success: boolean }>(`${BASE}/prompts/${id}`, {
      method: 'DELETE',
    }),
}
