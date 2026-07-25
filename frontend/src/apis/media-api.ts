import { request } from './request'
import type { PromptMedia } from '@/models/prompt'

const BASE = `${import.meta.env.VITE_BACKEND_URL}/api/v1`

export const mediaApi = {
  /**
   * Upload a media file. Returns a PromptMedia object that can be referenced
   * in prompt creation via mediaIds.
   */
  upload: (file: File, mediaType: 'image' | 'video') => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('mediaType', mediaType)

    return request<{ data: PromptMedia }>(`${BASE}/media/upload`, {
      method: 'POST',
      body: formData,
      // Don't set Content-Type — browser sets it with boundary for FormData
    })
  },
}
