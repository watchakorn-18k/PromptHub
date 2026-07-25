<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/use-user-store'
import { usePromptStore } from '@/stores/use-prompt-store'
import { satangToThb, modelLabels, modelColors } from '@/models/prompt'
import ModelBadge from '@/components/ModelBadge.vue'
import PromptDetailContent from '@/components/PromptDetailContent.vue'

definePage({
  meta: {
    title: 'Prompt Detail',
  },
})

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const promptStore = usePromptStore()

const promptId = computed(() => String((route.params as Record<string, string>).id))

// Gallery state
const activeMediaIndex = ref(0)

const isOwner = computed(() => {
  return userStore.isAuthenticated && promptStore.currentPrompt?.creator.id === userStore.currentUser?.id
})

const activeMedia = computed(() => {
  const media = promptStore.currentPrompt?.media ?? []
  return media[activeMediaIndex.value] ?? null
})

const isForbidden = computed(() => {
  return promptStore.detailError?.includes('403') || promptStore.detailError?.includes('not yet published')
})

const showDetailError = computed({
  get: () => promptStore.detailError !== null && !isForbidden.value,
  set: () => {},
})

// Load prompt on mount
onMounted(() => {
  loadPrompt()
})

async function loadPrompt() {
  promptStore.resetDetail()
  await promptStore.fetchPrompt(promptId.value)
}

function goToEdit() {
  router.push(`/prompts/${promptId.value}/edit`)
}

async function onPublish() {
  if (!promptStore.currentPrompt) return
  try {
    await promptStore.updatePrompt(promptId.value, { status: 'published' })
    promptStore.currentPrompt.status = 'published'
  }
  catch {
    // handled in store
  }
}
</script>

<template>
  <div>
    <!-- Loading State -->
    <template v-if="promptStore.isDetailLoading">
      <VRow>
        <VCol cols="12">
          <VSkeletonLoader type="breadcrumbs, heading@50%" />
        </VCol>
      </VRow>
      <VRow>
        <VCol cols="12" md="7">
          <VSkeletonLoader type="image@400x300" />
        </VCol>
        <VCol cols="12" md="5">
          <VSkeletonLoader type="chip@60, heading, text, text, text, text" />
        </VCol>
      </VRow>
    </template>

    <!-- Forbidden / Not Found -->
    <VCard
      v-else-if="promptStore.detailError && !promptStore.currentPrompt"
      class="text-center pa-10"
    >
      <VIcon
        :icon="isForbidden ? 'ri-lock-line' : 'ri-question-line'"
        size="56"
        :color="isForbidden ? 'warning' : 'grey-lighten-1'"
        class="mb-4"
      />
      <h5 class="text-h5 mb-2">
        {{ isForbidden ? 'Prompt Not Available' : 'Prompt Not Found' }}
      </h5>
      <p class="text-body-1 text-medium-emphasis mb-4">
        {{ isForbidden ? 'This prompt is not yet published.' : 'The prompt you\'re looking for doesn\'t exist or has been removed.' }}
      </p>
      <VBtn
        variant="tonal"
        color="primary"
        to="/prompts"
      >
        Browse Prompts
      </VBtn>
    </VCard>

    <!-- Prompt Detail -->
    <template v-else-if="promptStore.currentPrompt">
      <!-- Breadcrumb -->
      <div class="d-flex align-center text-body-2 mb-4">
        <RouterLink
          to="/prompts"
          class="text-decoration-none text-medium-emphasis"
        >
          Prompts
        </RouterLink>
        <VIcon icon="ri-arrow-right-s-line" size="16" class="mx-1" />
        <span class="text-primary font-weight-medium">{{ promptStore.currentPrompt.title }}</span>
      </div>

      <!-- Status Banner (Draft/Archived) -->
      <VAlert
        v-if="promptStore.currentPrompt.status !== 'published'"
        :color="promptStore.currentPrompt.status === 'draft' ? 'warning' : 'secondary'"
        variant="tonal"
        density="compact"
        class="mb-4"
      >
        <template #prepend>
          <VIcon :icon="promptStore.currentPrompt.status === 'draft' ? 'ri-edit-line' : 'ri-archive-line'" />
        </template>
        <div class="d-flex align-center justify-space-between w-100 flex-wrap gap-2">
          <span>
            This prompt is <strong>{{ promptStore.currentPrompt.status }}</strong>.
            {{ isOwner ? 'Only you can see it.' : '' }}
          </span>
          <div
            v-if="isOwner"
            class="d-flex gap-2"
          >
            <VBtn
              size="small"
              variant="tonal"
              color="primary"
              @click="goToEdit"
            >
              Edit
            </VBtn>
            <VBtn
              v-if="promptStore.currentPrompt.status === 'draft'"
              size="small"
              color="primary"
              :loading="promptStore.isSaving"
              @click="onPublish"
            >
              Publish
            </VBtn>
          </div>
        </div>
      </VAlert>

      <VRow>
        <!-- Media Gallery -->
        <VCol cols="12" md="7">
          <VCard class="mb-4">
            <!-- Main Media -->
            <div class="detail-gallery__main">
              <VImg
                v-if="activeMedia && activeMedia.mediaType === 'image'"
                :src="activeMedia.url"
                height="400"
                cover
                class="bg-grey-lighten-3"
              />
              <div
                v-else-if="activeMedia && activeMedia.mediaType === 'video'"
                class="d-flex align-center justify-center bg-grey-lighten-3"
                style="height: 400px;"
              >
                <video
                  :src="activeMedia.url"
                  controls
                  class="w-100 h-100"
                  style="object-fit: cover;"
                />
              </div>
              <div
                v-else
                class="d-flex align-center justify-center bg-grey-lighten-3"
                style="height: 400px;"
              >
                <VIcon icon="ri-image-line" size="64" color="grey-lighten-1" />
              </div>
            </div>

            <!-- Thumbnail Strip -->
            <VCardText
              v-if="(promptStore.currentPrompt.media?.length ?? 0) > 1"
            >
              <div class="d-flex flex-wrap gap-2">
                <VAvatar
                  v-for="(media, idx) in promptStore.currentPrompt.media"
                  :key="media.id"
                  size="56"
                  rounded="sm"
                  class="cursor-pointer"
                  :class="{ 'ring ring-primary': idx === activeMediaIndex }"
                  @click="activeMediaIndex = idx"
                >
                  <VImg
                    v-if="media.mediaType === 'image'"
                    :src="media.url"
                    cover
                  />
                  <div
                    v-else
                    class="d-flex align-center justify-center w-100 h-100 bg-grey-lighten-3"
                  >
                    <VIcon icon="ri-video-line" size="20" />
                  </div>
                </VAvatar>
              </div>
            </VCardText>
          </VCard>
        </VCol>

        <!-- Info Panel -->
        <VCol cols="12" md="5">
          <VCard>
            <VCardText>
              <h4 class="text-h4 mb-2">
                {{ promptStore.currentPrompt.title }}
              </h4>

              <!-- Creator -->
              <div class="d-flex align-center mb-3">
                <VAvatar
                  size="28"
                  class="me-2"
                >
                  <VImg
                    v-if="promptStore.currentPrompt.creator?.avatarUrl"
                    :src="promptStore.currentPrompt.creator.avatarUrl"
                  />
                  <span class="text-caption">{{ (promptStore.currentPrompt.creator?.displayName ?? '?')[0] }}</span>
                </VAvatar>
                <span class="text-body-2">{{ promptStore.currentPrompt.creator?.displayName ?? 'Unknown' }}</span>
                <VSpacer />
                <ModelBadge :model-type="promptStore.currentPrompt.modelType" />
              </div>

              <!-- Price -->
              <div class="d-flex align-center justify-space-between mb-4">
                <span class="text-h5 font-weight-bold text-primary">
                  ฿{{ satangToThb(promptStore.currentPrompt.price).toLocaleString() }}
                </span>
              </div>

              <!-- Description -->
              <div class="mb-4">
                <h6 class="text-h6 mb-1">Description</h6>
                <p class="text-body-2 text-medium-emphasis mb-0">
                  {{ promptStore.currentPrompt.description || 'No description provided.' }}
                </p>
              </div>

              <!-- Parameters -->
              <div class="mb-4">
                <h6 class="text-h6 mb-2">Parameters</h6>
                <VTable density="compact">
                  <tbody>
                    <tr
                      v-for="(value, key) in promptStore.currentPrompt.parameters"
                      :key="key"
                    >
                      <td class="text-body-2 text-medium-emphasis text-capitalize ps-0">{{ key.replace(/_/g, ' ') }}:</td>
                      <td class="text-body-2 font-weight-medium">{{ String(value ?? '—') }}</td>
                    </tr>
                    <tr v-if="!promptStore.currentPrompt.parameters || Object.keys(promptStore.currentPrompt.parameters).length === 0">
                      <td colspan="2" class="text-body-2 text-medium-emphasis ps-0">No parameters configured.</td>
                    </tr>
                  </tbody>
                </VTable>
              </div>

              <!-- Content -->
              <div class="mb-4">
                <h6 class="text-h6 mb-2">Content</h6>
                <PromptDetailContent
                  :content="promptStore.currentPrompt.content"
                  :is-locked="false"
                />
              </div>

              <!-- Metadata -->
              <div class="text-body-2 text-medium-emphasis">
                Created {{ new Date(promptStore.currentPrompt.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) }}
              </div>

              <!-- Owner Actions -->
              <div
                v-if="isOwner"
                class="mt-4 pt-4 border-top"
              >
                <VBtn
                  block
                  variant="tonal"
                  color="primary"
                  prepend-icon="ri-pencil-line"
                  @click="goToEdit"
                >
                  Edit Prompt
                </VBtn>
              </div>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>
    </template>

    <!-- Error Snackbar -->
    <VSnackbar
      v-model="showDetailError"
      color="error"
      variant="tonal"
      timeout="5000"
    >
      {{ promptStore.detailError }}
      <template #actions>
        <VBtn
          color="white"
          variant="text"
          @click="loadPrompt"
        >
          Retry
        </VBtn>
      </template>
    </VSnackbar>
  </div>
</template>

<style scoped>
.ring {
  border: 2px solid rgb(var(--v-theme-primary));
}
.border-top {
  border-top: 1px solid rgba(var(--v-border-color), 0.3);
}
.detail-gallery__main {
  overflow: hidden;
  border-radius: 6px 6px 0 0;
}
</style>
