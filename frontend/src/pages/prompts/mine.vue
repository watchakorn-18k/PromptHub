<script setup lang="ts">
import { useUserStore } from '@/stores/use-user-store'
import { usePromptStore } from '@/stores/use-prompt-store'
import { satangToThb, statusLabels, statusColors, modelLabels } from '@/models/prompt'
import type { PromptStatus } from '@/models/prompt'

definePage({
  meta: {
    title: 'My Prompts',
    requiresAuth: true,
    requiredRole: 'creator',
  },
})

const router = useRouter()
const userStore = useUserStore()
const promptStore = usePromptStore()

const showMyError = computed({
  get: () => promptStore.myError !== null,
  set: () => {},
})

// Route guard: redirect if not authenticated or not creator
onMounted(() => {
  if (!userStore.isAuthenticated) {
    router.push('/login')
    return
  }
  if (userStore.userRole !== 'creator') {
    router.push('/')
    return
  }
  loadMyPrompts()
})

// Tab state
const activeTab = ref('all')
const confirmDelete = ref(false)
const promptToDelete = ref<{ id: string; title: string } | null>(null)

const tabs = [
  { label: 'All', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Published', value: 'published' },
  { label: 'Archived', value: 'archived' },
]

async function loadMyPrompts() {
  const statusFilter = activeTab.value === 'all' ? undefined : activeTab.value as PromptStatus
  await promptStore.fetchMyPrompts({ status: statusFilter })
}

function onTabChange(val: string) {
  activeTab.value = val
  loadMyPrompts()
}

function goToNew() {
  router.push('/prompts/new')
}

function goToEdit(id: string) {
  router.push(`/prompts/${id}/edit`)
}

function goToDetail(id: string) {
  router.push(`/prompts/${id}`)
}

function promptDeleteClick(prompt: { id: string; title: string }) {
  promptToDelete.value = prompt
  confirmDelete.value = true
}

async function onConfirmDelete() {
  if (!promptToDelete.value) return
  try {
    await promptStore.deletePrompt(promptToDelete.value.id)
    confirmDelete.value = false
    promptToDelete.value = null
  }
  catch {
    // Error handled in store
  }
}
</script>

<template>
  <div>
    <!-- Header -->
    <VRow>
      <VCol cols="12">
        <div class="d-flex align-center justify-space-between flex-wrap gap-2">
          <div>
            <h4 class="text-h4 mb-1">
              My Prompts
            </h4>
            <p class="text-body-2 text-medium-emphasis mb-0">
              Manage your AI prompt collection
            </p>
          </div>
          <VBtn
            color="primary"
            prepend-icon="ri-add-line"
            @click="goToNew"
          >
            New Prompt
          </VBtn>
        </div>
      </VCol>
    </VRow>

    <!-- Tabs -->
    <VTabs
      v-model="activeTab"
      class="my-4"
      @update:model-value="onTabChange"
    >
      <VTab
        v-for="tab in tabs"
        :key="tab.value"
        :value="tab.value"
      >
        {{ tab.label }}
      </VTab>
    </VTabs>

    <!-- Loading State -->
    <VCard v-if="promptStore.isMyLoading && promptStore.myPrompts.length === 0">
      <VList>
        <VListItem
          v-for="n in 5"
          :key="n"
        >
          <template #prepend>
            <VSkeletonLoader type="avatar@40" />
          </template>
          <VSkeletonLoader type="heading@60%, text@40%" />
        </VListItem>
      </VList>
    </VCard>

    <!-- Empty State -->
    <VCard
      v-else-if="!promptStore.isMyLoading && promptStore.myPrompts.length === 0"
      class="text-center pa-10"
    >
      <VIcon
        icon="ri-pencil-ruler-2-line"
        size="56"
        color="grey-lighten-1"
        class="mb-4"
      />
      <h5 class="text-h5 mb-2">
        {{ activeTab === 'all' ? "You haven't created any prompts yet" : 'No prompts match this status' }}
      </h5>
      <p class="text-body-1 text-medium-emphasis mb-4">
        {{ activeTab === 'all' ? 'Create your first prompt and share it with the community.' : 'Try switching to a different tab.' }}
      </p>
      <VBtn
        v-if="activeTab === 'all'"
        color="primary"
        @click="goToNew"
      >
        Create Your First Prompt
      </VBtn>
    </VCard>

    <!-- Prompt Table -->
    <VCard v-else>
      <VTable class="text-no-wrap">
        <thead>
          <tr>
            <th scope="col">Title</th>
            <th scope="col">Model</th>
            <th scope="col">Price</th>
            <th scope="col">Status</th>
            <th scope="col">Created</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="prompt in promptStore.myPrompts"
            :key="prompt.id"
            class="cursor-pointer"
            @click="goToDetail(prompt.id)"
          >
            <td class="font-weight-medium">
              <span class="text-truncate d-inline-block" style="max-width: 220px;">
                {{ prompt.title }}
              </span>
            </td>
            <td>
              <VChip
                size="x-small"
                :color="prompt.modelType === 'mj' ? 'success' : prompt.modelType === 'chatgpt' ? 'info' : 'warning'"
                variant="tonal"
              >
                {{ modelLabels[prompt.modelType] }}
              </VChip>
            </td>
            <td>
              ฿{{ satangToThb(prompt.price).toLocaleString() }}
            </td>
            <td>
              <VChip
                size="x-small"
                :color="statusColors[prompt.status]"
                variant="tonal"
              >
                {{ statusLabels[prompt.status] }}
              </VChip>
            </td>
            <td class="text-medium-emphasis text-body-2">
              {{ new Date(prompt.createdAt).toLocaleDateString() }}
            </td>
            <td @click.stop>
              <IconBtn
                size="small"
                color="primary"
                @click="goToEdit(prompt.id)"
              >
                <VIcon icon="ri-pencil-line" />
              </IconBtn>
              <IconBtn
                size="small"
                color="error"
                @click="promptDeleteClick({ id: prompt.id, title: prompt.title })"
              >
                <VIcon icon="ri-delete-bin-line" />
              </IconBtn>
            </td>
          </tr>
        </tbody>
      </VTable>
    </VCard>

    <!-- Load More -->
    <div
      v-if="promptStore.myHasMore && promptStore.myPrompts.length > 0"
      class="text-center mt-4"
    >
      <VBtn
        variant="tonal"
        color="primary"
        :loading="promptStore.isMyLoading"
        @click="loadMyPrompts"
      >
        Load More
      </VBtn>
    </div>

    <!-- Delete Confirmation Dialog -->
    <VDialog
      v-model="confirmDelete"
      max-width="400"
    >
      <VCard>
        <VCardTitle class="text-h5">
          Delete Prompt
        </VCardTitle>
        <VCardText>
          <p class="text-body-1 mb-0">
            Are you sure you want to delete
            <strong>“{{ promptToDelete?.title }}”</strong>?
            This cannot be undone.
          </p>
        </VCardText>
        <VCardActions class="pa-4 pt-0">
          <VSpacer />
          <VBtn
            variant="tonal"
            color="secondary"
            @click="confirmDelete = false"
          >
            Cancel
          </VBtn>
          <VBtn
            color="error"
            :loading="promptStore.isSaving"
            @click="onConfirmDelete"
          >
            Delete
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Error Snackbar -->
    <VSnackbar
      v-model="showMyError"
      color="error"
      variant="tonal"
      timeout="5000"
    >
      {{ promptStore.myError }}
      <template #actions>
        <VBtn
          color="white"
          variant="text"
          @click="loadMyPrompts"
        >
          Retry
        </VBtn>
      </template>
    </VSnackbar>
  </div>
</template>
