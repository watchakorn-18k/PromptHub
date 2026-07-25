<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/use-user-store'
import { usePromptStore } from '@/stores/use-prompt-store'
import { satangToThb, thbToSatang, modelLabels } from '@/models/prompt'
import type { ModelType } from '@/models/prompt'
import { VForm } from 'vuetify/components'
import PromptParameterForm from '@/components/PromptParameterForm.vue'
import PromptMediaUploader from '@/components/PromptMediaUploader.vue'

definePage({
  meta: {
    title: 'Edit Prompt',
    requiresAuth: true,
    requiredRole: 'creator',
  },
})

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const promptStore = usePromptStore()

const promptId = computed(() => String((route.params as Record<string, string>).id))

// Route guard
onMounted(() => {
  if (!userStore.isAuthenticated) return router.push('/login')
  if (userStore.userRole !== 'creator') return router.push('/')
  loadPrompt()
})

// Form state
const refForm = ref<VForm>()

const title = ref('')
const description = ref('')
const priceThb = ref<number | null>(null)
const modelType = ref<ModelType>('mj')
const parameters = ref<Record<string, unknown>>({})
const content = ref('')
const mediaIds = ref<string[]>([])
const existingMedia = ref<any[]>([])
const currentStatus = ref<string>('')

const isLoading = ref(true)
const isSaving = ref(false)
const notFound = ref(false)
const saveSuccess = ref(false)

const showEditSaveError = computed({
  get: () => promptStore.saveError !== null,
  set: () => {},
})

async function loadPrompt() {
  isLoading.value = true
  try {
    await promptStore.fetchPrompt(promptId.value)

    if (!promptStore.currentPrompt) {
      notFound.value = true
      return
    }

    // Check ownership
    if (userStore.currentUser?.id !== promptStore.currentPrompt.creator.id) {
      notFound.value = true
      return
    }

    // Pre-fill form
    const p = promptStore.currentPrompt
    title.value = p.title
    description.value = p.description || ''
    priceThb.value = satangToThb(p.price)
    modelType.value = p.modelType
    parameters.value = { ...p.parameters }
    content.value = p.content
    existingMedia.value = p.media || []
    mediaIds.value = (p.media || []).map((m: any) => m.id)
    currentStatus.value = p.status
  }
  catch {
    notFound.value = true
  }
  finally {
    isLoading.value = false
  }
}

const canPublish = computed(() => {
  return title.value.trim() && priceThb.value !== null && priceThb.value > 0 && content.value.trim()
})

const showModelWarning = ref(false)
const pendingModelType = ref<ModelType>('mj')

function onModelChange(val: ModelType) {
  if (val !== modelType.value) {
    pendingModelType.value = val
    showModelWarning.value = true
  }
}

function confirmModelChange() {
  modelType.value = pendingModelType.value
  showModelWarning.value = false
  parameters.value = {}
}

function cancelModelChange() {
  showModelWarning.value = false
}

function onParametersUpdate(val: Record<string, unknown>) {
  parameters.value = val
}

function onMediaIdsUpdate(ids: string[]) {
  mediaIds.value = ids
}

async function onSave(status: 'draft' | 'published' | 'archived') {
  const isFormValid = await refForm?.value?.validate()
  if (!isFormValid?.valid) return

  isSaving.value = true

  try {
    await promptStore.updatePrompt(promptId.value, {
      title: title.value.trim(),
      description: description.value.trim() || undefined,
      price: thbToSatang(priceThb.value ?? 0),
      modelType: modelType.value,
      parameters: { ...parameters.value },
      content: content.value.trim(),
      status,
      mediaIds: mediaIds.value.length > 0 ? mediaIds.value : undefined,
    })

    saveSuccess.value = true

    setTimeout(() => {
      router.push(`/prompts/${promptId.value}`)
    }, 1000)
  }
  catch {
    // handled in store
  }
  finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div>
    <!-- Loading State -->
    <template v-if="isLoading">
      <VRow>
        <VCol cols="12">
          <VSkeletonLoader type="heading, breadcrumbs" />
        </VCol>
      </VRow>
      <VCard>
        <VCardText>
          <VSkeletonLoader type="text, text, text, chip, text, image" />
        </VCardText>
      </VCard>
    </template>

    <!-- Not Found -->
    <VCard
      v-else-if="notFound"
      class="text-center pa-10"
    >
      <VIcon icon="ri-question-line" size="56" color="grey-lighten-1" class="mb-4" />
      <h5 class="text-h5 mb-2">Prompt Not Found</h5>
      <p class="text-body-1 text-medium-emphasis mb-4">
        This prompt doesn't exist or you don't have permission to edit it.
      </p>
      <VBtn
        variant="tonal"
        color="primary"
        to="/prompts/mine"
      >
        Back to My Prompts
      </VBtn>
    </VCard>

    <!-- Edit Form -->
    <template v-else>
      <!-- Header -->
      <VRow>
        <VCol cols="12">
          <div class="d-flex align-center justify-space-between flex-wrap gap-2">
            <div>
              <div class="d-flex align-center text-body-2 mb-1">
                <RouterLink
                  to="/prompts/mine"
                  class="text-decoration-none text-medium-emphasis"
                >
                  My Prompts
                </RouterLink>
                <VIcon icon="ri-arrow-right-s-line" size="16" class="mx-1" />
                <span class="text-primary font-weight-medium text-truncate" style="max-width: 300px;">{{ title || 'Edit Prompt' }}</span>
              </div>
              <h4 class="text-h4">
                Edit Prompt
              </h4>
            </div>
            <div class="d-flex gap-2">
              <VBtn
                variant="tonal"
                color="secondary"
                :loading="isSaving"
                @click="onSave('draft')"
              >
                Save Draft
              </VBtn>
              <VBtn
                color="primary"
                :disabled="!canPublish"
                :loading="isSaving"
                @click="onSave('published')"
              >
                Save & Publish
              </VBtn>
              <VBtn
                variant="outlined"
                color="secondary"
                :loading="isSaving"
                @click="onSave('archived')"
              >
                Archive
              </VBtn>
            </div>
          </div>
        </VCol>
      </VRow>

      <!-- Form (same layout as Create) -->
      <VForm ref="refForm">
        <VCard class="mt-4">
          <VCardText>
            <h5 class="text-h5 mb-4">1. Basic Info</h5>
            <VRow>
              <VCol cols="12">
                <VTextField
                  v-model="title"
                  label="Title *"
                  placeholder="e.g., Cinematic Portrait"
                  :rules="[requiredValidator]"
                  density="comfortable"
                  variant="outlined"
                  clearable
                />
              </VCol>
              <VCol cols="12">
                <VTextarea
                  v-model="description"
                  label="Description"
                  placeholder="Describe what this prompt does..."
                  rows="3"
                  auto-grow
                  density="comfortable"
                  variant="outlined"
                  clearable
                  counter
                  maxlength="1000"
                />
              </VCol>
              <VCol cols="12" sm="6">
                <VTextField
                  v-model.number="priceThb"
                  label="Price (THB) *"
                  type="number"
                  placeholder="99"
                  min="0"
                  :rules="[requiredValidator, (v: number) => v > 0 || 'Price must be greater than 0']"
                  density="comfortable"
                  variant="outlined"
                  prefix="฿"
                />
              </VCol>
            </VRow>
          </VCardText>
        </VCard>

        <VCard class="mt-4">
          <VCardText>
            <h5 class="text-h5 mb-4">2. Model & Parameters</h5>
            <VRow>
              <VCol cols="12">
                <label class="text-body-2 font-weight-medium d-block mb-2">Model Type *</label>
                <div class="d-flex flex-wrap gap-3">
                  <VCard
                    v-for="model in ['mj', 'chatgpt', 'sora']"
                    :key="model"
                    class="model-select-card"
                    :class="{ 'model-select-card--active': modelType === model }"
                    @click="onModelChange(model as ModelType)"
                  >
                    <VCardText class="d-flex align-center gap-2 pa-3">
                      <VRadio
                        :model-value="modelType === model"
                        color="primary"
                        readonly
                      />
                      <span class="font-weight-medium">{{ modelLabels[model as ModelType] }}</span>
                    </VCardText>
                  </VCard>
                </div>
              </VCol>
            </VRow>

            <VDialog
              v-model="showModelWarning"
              max-width="400"
            >
              <VCard>
                <VCardTitle class="text-h5">Change Model Type?</VCardTitle>
                <VCardText>
                  <p class="text-body-1 mb-0">
                    Changing the model type will reset all parameter fields. Are you sure?
                  </p>
                </VCardText>
                <VCardActions class="pa-4 pt-0">
                  <VSpacer />
                  <VBtn variant="tonal" color="secondary" @click="cancelModelChange">Cancel</VBtn>
                  <VBtn color="warning" @click="confirmModelChange">Reset Parameters</VBtn>
                </VCardActions>
              </VCard>
            </VDialog>

            <div class="mt-4">
              <label class="text-body-2 font-weight-medium d-block mb-2">Parameters</label>
              <PromptParameterForm
                :model-type="modelType"
                :parameters="parameters"
                @update:parameters="onParametersUpdate"
              />
            </div>
          </VCardText>
        </VCard>

        <VCard class="mt-4">
          <VCardText>
            <h5 class="text-h5 mb-4">3. Media Upload</h5>
            <PromptMediaUploader
              :existing-media="existingMedia"
              :max-files="10"
              @update:media-ids="onMediaIdsUpdate"
            />
          </VCardText>
        </VCard>

        <VCard class="mt-4">
          <VCardText>
            <h5 class="text-h5 mb-4">4. Prompt Content</h5>
            <VRow>
              <VCol cols="12">
                <VTextarea
                  v-model="content"
                  label="Prompt Content *"
                  placeholder="e.g., cinematic portrait of [subject], moody lighting, rim light..."
                  rows="6"
                  auto-grow
                  :rules="[requiredValidator]"
                  density="comfortable"
                  variant="outlined"
                />
                <p class="text-caption text-medium-emphasis mt-1">
                  <VIcon icon="ri-information-line" size="14" class="me-1" />
                  Use <code class="text-primary">[brackets]</code> for placeholders.
                </p>
              </VCol>
            </VRow>
          </VCardText>
        </VCard>

        <div class="d-flex justify-end gap-2 mt-4 mb-8">
          <VBtn
            variant="tonal"
            color="secondary"
            :loading="isSaving"
            @click="onSave('draft')"
          >
            Save Draft
          </VBtn>
          <VBtn
            color="primary"
            :disabled="!canPublish"
            :loading="isSaving"
            @click="onSave('published')"
          >
            Save & Publish
          </VBtn>
          <VBtn
            variant="outlined"
            color="secondary"
            :loading="isSaving"
            @click="onSave('archived')"
          >
            Archive
          </VBtn>
        </div>
      </VForm>
    </template>

    <!-- Success Snackbar -->
    <VSnackbar
      v-model="saveSuccess"
      color="success"
      variant="tonal"
      timeout="3000"
    >
      Prompt updated successfully!
    </VSnackbar>

    <!-- Error Snackbar -->
    <VSnackbar
      v-model="showEditSaveError"
      color="error"
      variant="tonal"
      timeout="5000"
    >
      {{ promptStore.saveError }}
    </VSnackbar>
  </div>
</template>

<style scoped>
.model-select-card {
  border: 2px solid transparent;
  cursor: pointer;
  transition: border-color 0.2s;
  min-width: 140px;
}
.model-select-card:hover {
  border-color: rgba(var(--v-theme-primary), 0.3);
}
.model-select-card--active {
  border-color: rgb(var(--v-theme-primary));
  background-color: rgba(var(--v-theme-primary), 0.04);
}
</style>
