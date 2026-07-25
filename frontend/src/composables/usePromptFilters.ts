import type { ModelType, PromptSort } from '@/models/prompt'

/**
 * Composable for managing prompt filter/search state with debounced search.
 */
export function usePromptFilters() {
  const modelType = ref<ModelType | ''>('')
  const searchQuery = ref('')
  const debouncedSearch = ref('')
  const sort = ref<PromptSort>('newest')
  const minPrice = ref<number | undefined>(undefined)
  const maxPrice = ref<number | undefined>(undefined)
  const status = ref<string>('')

  // Debounce search input (300ms)
  let searchTimer: ReturnType<typeof setTimeout> | null = null
  watch(searchQuery, (val) => {
    if (searchTimer) clearTimeout(searchTimer)
    searchTimer = setTimeout(() => {
      debouncedSearch.value = val
    }, 300)
  })

  function buildFilters(extra: Record<string, any> = {}): Record<string, string | number | undefined> {
    const filters: Record<string, string | number | undefined> = {
      ...extra,
      sort: sort.value || 'newest',
    }

    if (modelType.value) {
      filters.modelType = modelType.value
    }
    if (debouncedSearch.value) {
      filters.search = debouncedSearch.value
    }
    if (minPrice.value !== undefined) {
      filters.minPrice = minPrice.value
    }
    if (maxPrice.value !== undefined) {
      filters.maxPrice = maxPrice.value
    }
    if (status.value) {
      filters.status = status.value
    }

    return filters
  }

  function resetFilters() {
    modelType.value = ''
    searchQuery.value = ''
    debouncedSearch.value = ''
    sort.value = 'newest'
    minPrice.value = undefined
    maxPrice.value = undefined
    status.value = ''
  }

  return {
    modelType,
    searchQuery,
    debouncedSearch,
    sort,
    minPrice,
    maxPrice,
    status,
    buildFilters,
    resetFilters,
  }
}
