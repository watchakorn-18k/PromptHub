import { defineStore } from 'pinia'
import { promptApi } from '@/apis/prompt-api'
import type {
  CreatePromptInput,
  PromptDetail,
  PromptFilters,
  PromptListItem,
  UpdatePromptInput,
} from '@/models/prompt'

export const usePromptStore = defineStore('PromptStore', () => {
  /* ── Public Listing State ── */
  const prompts = ref<PromptListItem[]>([])
  const cursor = ref<string | null>(null)
  const hasMore = ref(false)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  /* ── My Prompts State ── */
  const myPrompts = ref<PromptListItem[]>([])
  const myCursor = ref<string | null>(null)
  const myHasMore = ref(false)
  const isMyLoading = ref(false)
  const myError = ref<string | null>(null)

  /* ─── Detail State ─── */
  const currentPrompt = ref<PromptDetail | null>(null)
  const isDetailLoading = ref(false)
  const detailError = ref<string | null>(null)

  /* ─── Mutation State ─── */
  const isSaving = ref(false)
  const saveError = ref<string | null>(null)

  /* ── Public Listing Actions ── */

  async function fetchPrompts(filters: PromptFilters = {}) {
    isLoading.value = true
    error.value = null
    try {
      const res = await promptApi.list(filters)
      prompts.value = res.data
      cursor.value = res.pagination.cursor ?? null
      hasMore.value = res.pagination.hasMore
    }
    catch (e: any) {
      error.value = e.message || 'Failed to load prompts.'
    }
    finally {
      isLoading.value = false
    }
  }

  async function fetchMorePrompts(filters: PromptFilters = {}) {
    if (!hasMore.value || isLoading.value) return

    isLoading.value = true
    try {
      const res = await promptApi.list({ ...filters, cursor: cursor.value ?? undefined })
      prompts.value = [...prompts.value, ...res.data]
      cursor.value = res.pagination.cursor ?? null
      hasMore.value = res.pagination.hasMore
    }
    catch (e: any) {
      error.value = e.message || 'Failed to load more prompts.'
    }
    finally {
      isLoading.value = false
    }
  }

  /* ── My Prompts Actions ── */

  async function fetchMyPrompts(filters: PromptFilters = {}) {
    isMyLoading.value = true
    myError.value = null
    try {
      const res = await promptApi.listMine(filters)
      myPrompts.value = res.data
      myCursor.value = res.pagination.cursor ?? null
      myHasMore.value = res.pagination.hasMore
    }
    catch (e: any) {
      myError.value = e.message || 'Failed to load your prompts.'
    }
    finally {
      isMyLoading.value = false
    }
  }

  async function fetchMoreMyPrompts(filters: PromptFilters = {}) {
    if (!myHasMore.value || isMyLoading.value) return

    isMyLoading.value = true
    try {
      const res = await promptApi.listMine({ ...filters, cursor: myCursor.value ?? undefined })
      myPrompts.value = [...myPrompts.value, ...res.data]
      myCursor.value = res.pagination.cursor ?? null
      myHasMore.value = res.pagination.hasMore
    }
    catch (e: any) {
      myError.value = e.message || 'Failed to load more prompts.'
    }
    finally {
      isMyLoading.value = false
    }
  }

  /* ── Detail Actions ── */

  async function fetchPrompt(id: string) {
    isDetailLoading.value = true
    detailError.value = null
    try {
      const res = await promptApi.getById(id)
      currentPrompt.value = res.data
    }
    catch (e: any) {
      detailError.value = e.message || 'Failed to load prompt.'
    }
    finally {
      isDetailLoading.value = false
    }
  }

  /* ── Mutation Actions ── */

  async function createPrompt(body: CreatePromptInput) {
    isSaving.value = true
    saveError.value = null
    try {
      const res = await promptApi.create(body)
      // Prepend to myPrompts list for instant UI update
      const d = res.data
      myPrompts.value.unshift({
        id: d.id,
        title: d.title,
        description: d.description,
        price: d.price,
        modelType: d.modelType,
        status: d.status,
        previewMedia: d.media?.slice(0, 1) ?? [],
        creator: d.creator,
        createdAt: d.createdAt,
      })
      return res.data
    }
    catch (e: any) {
      saveError.value = e.message || 'Failed to create prompt.'
      throw e
    }
    finally {
      isSaving.value = false
    }
  }

  async function updatePrompt(id: string, body: UpdatePromptInput) {
    isSaving.value = true
    saveError.value = null
    try {
      const res = await promptApi.update(id, body)
      // Update in myPrompts list
      const idx = myPrompts.value.findIndex(p => p.id === id)
      if (idx !== -1) {
        const d = res.data
        myPrompts.value[idx] = {
          id: d.id,
          title: d.title,
          description: d.description,
          price: d.price,
          modelType: d.modelType,
          status: d.status,
          previewMedia: d.media?.slice(0, 1) ?? [],
          creator: d.creator,
          createdAt: d.createdAt,
        }
      }
      return res.data
    }
    catch (e: any) {
      saveError.value = e.message || 'Failed to update prompt.'
      throw e
    }
    finally {
      isSaving.value = false
    }
  }

  async function deletePrompt(id: string) {
    isSaving.value = true
    saveError.value = null
    try {
      await promptApi.delete(id)
      myPrompts.value = myPrompts.value.filter(p => p.id !== id)
    }
    catch (e: any) {
      saveError.value = e.message || 'Failed to delete prompt.'
      throw e
    }
    finally {
      isSaving.value = false
    }
  }

  /* ── Reset ── */

  function resetDetail() {
    currentPrompt.value = null
    isDetailLoading.value = false
    detailError.value = null
  }

  function resetPrompts() {
    prompts.value = []
    cursor.value = null
    hasMore.value = false
    isLoading.value = false
    error.value = null
  }

  function resetMyPrompts() {
    myPrompts.value = []
    myCursor.value = null
    myHasMore.value = false
    isMyLoading.value = false
    myError.value = null
  }

  return {
    // Public state
    prompts,
    cursor,
    hasMore,
    isLoading,
    error,
    // My prompts state
    myPrompts,
    myCursor,
    myHasMore,
    isMyLoading,
    myError,
    // Detail state
    currentPrompt,
    isDetailLoading,
    detailError,
    // Mutation state
    isSaving,
    saveError,
    // Public actions
    fetchPrompts,
    fetchMorePrompts,
    // My prompts actions
    fetchMyPrompts,
    fetchMoreMyPrompts,
    // Detail actions
    fetchPrompt,
    // Mutation actions
    createPrompt,
    updatePrompt,
    deletePrompt,
    // Reset
    resetDetail,
    resetPrompts,
    resetMyPrompts,
  }
})
