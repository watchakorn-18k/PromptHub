<script setup lang="ts">
import type { ModelType } from '@/models/prompt'
import { modelLabels, modelColors } from '@/models/prompt'
import { usePromptStore } from '@/stores/use-prompt-store'
import { usePromptFilters } from '@/composables/usePromptFilters'
import PromptCard from '@/components/PromptCard.vue'

definePage({
  meta: {
    title: 'Browse Prompts',
  },
})

const promptStore = usePromptStore()
const filters = usePromptFilters()

// Price range display values (in THB, converted to satang for API)
const priceRangeMinThb = ref<number | undefined>(undefined)
const priceRangeMaxThb = ref<number | undefined>(undefined)
const showFilters = ref(false)

const modelOptions: { label: string; value: ModelType | ''; color: string }[] = [
  { label: 'All Models', value: '', color: '' },
  { label: 'Midjourney', value: 'mj', color: modelColors.mj },
  { label: 'ChatGPT', value: 'chatgpt', color: modelColors.chatgpt },
  { label: 'Sora', value: 'sora', color: modelColors.sora },
]

const showErrorSnackbar = computed({
  get: () => promptStore.error !== null,
  set: () => { /* readonly — dismiss handled by timeout */ },
})

const sortOptions = [
  { label: 'Newest', value: 'newest' },
  { label: 'Oldest', value: 'oldest' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
]

async function loadPrompts() {
  const satangMin = priceRangeMinThb.value !== undefined ? priceRangeMinThb.value * 100 : undefined
  const satangMax = priceRangeMaxThb.value !== undefined ? priceRangeMaxThb.value * 100 : undefined

  await promptStore.fetchPrompts({
    modelType: filters.modelType.value || undefined,
    search: filters.debouncedSearch.value || undefined,
    minPrice: satangMin,
    maxPrice: satangMax,
    sort: filters.sort.value,
  })
}

async function loadMore() {
  const satangMin = priceRangeMinThb.value !== undefined ? priceRangeMinThb.value * 100 : undefined
  const satangMax = priceRangeMaxThb.value !== undefined ? priceRangeMaxThb.value * 100 : undefined

  await promptStore.fetchMorePrompts({
    modelType: filters.modelType.value || undefined,
    search: filters.debouncedSearch.value || undefined,
    minPrice: satangMin,
    maxPrice: satangMax,
    sort: filters.sort.value,
  })
}

function onModelFilterChange(val: ModelType | '') {
  filters.modelType.value = val
  loadPrompts()
}

function onSortChange(val: string) {
  filters.sort.value = val as any
  loadPrompts()
}

function onClearFilters() {
  filters.resetFilters()
  priceRangeMinThb.value = undefined
  priceRangeMaxThb.value = undefined
  loadPrompts()
}

// Watch debounced search
watch(() => filters.debouncedSearch.value, () => {
  loadPrompts()
})

// Load on mount
onMounted(() => {
  loadPrompts()
})
</script>

<template>
  <div>
    <!-- Header -->
    <VRow>
      <VCol cols="12">
        <h4 class="text-h4 mb-1">
          Browse Prompts
        </h4>
        <p class="text-body-2 text-medium-emphasis mb-0">
          Discover ready-to-use AI prompts from creators
        </p>
      </VCol>
    </VRow>

    <!-- Search & Filter Bar -->
    <VCard class="my-4">
      <VCardText>
        <VRow align="center">
          <VCol cols="12" md="5">
            <VTextField
              v-model="filters.searchQuery.value"
              placeholder="Search prompts..."
              prepend-inner-icon="ri-search-line"
              density="comfortable"
              hide-details
              clearable
              variant="outlined"
            />
          </VCol>
          <VCol cols="6" md="3">
            <VSelect
              :model-value="filters.sort.value"
              :items="sortOptions"
              item-title="label"
              item-value="value"
              label="Sort by"
              density="comfortable"
              hide-details
              variant="outlined"
              @update:model-value="onSortChange"
            />
          </VCol>
          <VCol cols="6" md="2">
            <VBtn
              variant="tonal"
              color="secondary"
              prepend-icon="ri-filter-line"
              class="w-100"
              @click="showFilters = !showFilters"
            >
              Filters
            </VBtn>
          </VCol>
        </VRow>

        <!-- Expanded Filters -->
        <VExpandTransition>
          <VRow v-show="showFilters" class="mt-3">
            <!-- Model Type -->
            <VCol cols="12" md="4">
              <label class="text-body-2 text-medium-emphasis d-block mb-1">Model Type</label>
              <div class="d-flex flex-wrap gap-2">
                <VChip
                  v-for="opt in modelOptions"
                  :key="opt.value"
                  :color="opt.color || undefined"
                  :variant="filters.modelType.value === opt.value ? 'flat' : 'outlined'"
                  :class="{ 'font-weight-medium': filters.modelType.value === opt.value }"
                  filter
                  @click="onModelFilterChange(opt.value as ModelType | '')"
                >
                  {{ opt.label }}
                </VChip>
              </div>
            </VCol>

            <!-- Price Range -->
            <VCol cols="12" md="4">
              <label class="text-body-2 text-medium-emphasis d-block mb-1">Price Range (THB)</label>
              <div class="d-flex align-center gap-2">
                <VTextField
                  v-model="priceRangeMinThb"
                  type="number"
                  placeholder="Min"
                  density="compact"
                  hide-details
                  variant="outlined"
                  min="0"
                />
                <span class="text-body-2">—</span>
                <VTextField
                  v-model="priceRangeMaxThb"
                  type="number"
                  placeholder="Max"
                  density="compact"
                  hide-details
                  variant="outlined"
                  min="0"
                />
                <VBtn
                  size="small"
                  variant="tonal"
                  @click="loadPrompts()"
                >
                  Apply
                </VBtn>
              </div>
            </VCol>

            <!-- Clear Filters -->
            <VCol cols="12" md="4" class="d-flex align-end">
              <VBtn
                variant="text"
                color="secondary"
                size="small"
                prepend-icon="ri-close-circle-line"
                @click="onClearFilters"
              >
                Clear All Filters
              </VBtn>
            </VCol>
          </VRow>
        </VExpandTransition>
      </VCardText>
    </VCard>

    <!-- Loading State -->
    <VRow v-if="promptStore.isLoading && promptStore.prompts.length === 0">
      <VCol
        v-for="n in 6"
        :key="n"
        cols="12"
        sm="6"
        lg="4"
      >
        <VCard>
          <VSkeletonLoader class="rounded">
            <div style="height: 180px;" />
          </VSkeletonLoader>
          <VCardText>
            <VSkeletonLoader type="chip@24px, heading@70%, text@50%, text@30%" />
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Empty State -->
    <VRow v-else-if="!promptStore.isLoading && promptStore.prompts.length === 0">
      <VCol cols="12">
        <VCard class="text-center pa-10">
          <VIcon icon="ri-inbox-line" size="56" color="grey-lighten-1" class="mb-4" />
          <h5 class="text-h5 mb-2">No prompts found</h5>
          <p class="text-body-1 text-medium-emphasis mb-4">
            Try adjusting your search filters or check back later for new prompts.
          </p>
          <VBtn
            variant="tonal"
            color="primary"
            @click="onClearFilters"
          >
            Browse All Prompts
          </VBtn>
        </VCard>
      </VCol>
    </VRow>

    <!-- Prompt Grid -->
    <VRow v-else>
      <VCol
        v-for="prompt in promptStore.prompts"
        :key="prompt.id"
        cols="12"
        sm="6"
        lg="4"
      >
        <PromptCard :prompt="prompt" />
      </VCol>
    </VRow>

    <!-- Load More -->
    <div
      v-if="promptStore.hasMore && promptStore.prompts.length > 0"
      class="text-center mt-4"
    >
      <VBtn
        variant="tonal"
        color="primary"
        :loading="promptStore.isLoading"
        @click="loadMore"
      >
        Load More
      </VBtn>
    </div>

    <!-- End of Results -->
    <div
      v-if="!promptStore.hasMore && promptStore.prompts.length > 0"
      class="text-center text-medium-emphasis text-body-2 mt-4"
    >
      You've reached the end
    </div>

    <!-- Error Snackbar -->
    <VSnackbar
      v-model="showErrorSnackbar"
      color="error"
      variant="tonal"
      timeout="5000"
    >
      {{ promptStore.error }}
      <template #actions>
        <VBtn
          color="white"
          variant="text"
          @click="loadPrompts()"
        >
          Retry
        </VBtn>
      </template>
    </VSnackbar>
  </div>
</template>
