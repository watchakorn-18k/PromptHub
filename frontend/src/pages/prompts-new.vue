<script setup lang="ts">
import { useUserStore } from '@/stores/use-user-store'
import { usePromptStore } from '@/stores/use-prompt-store'
import { thbToSatang, modelLabels } from '@/models/prompt'
import type { ModelType } from '@/models/prompt'
import { VForm } from 'vuetify/components'
import PromptParameterForm from '@/components/PromptParameterForm.vue'
import PromptMediaUploader from '@/components/PromptMediaUploader.vue'

definePage({
  meta: {
    title: 'Create Prompt',
    requiresAuth: true,
    requiredRole: 'creator',
  },
})

const router = useRouter()
const userStore = useUserStore()
const promptStore = usePromptStore()

// Route guard
onMounted(() => {
  if (!userStore.isAuthenticated) return router.push('/login')
  if (userStore.userRole !== 'creator') return router.push('/')
})

const refForm = ref<VForm>()

// Basic info
const title = ref('')
const description = ref('')
const priceThb = ref<number | null>(null)

// Model selection
const modelType = ref<ModelType>('mj')

// Parameters (controlled by PromptParameterForm)
const parameters = ref<Record<string, unknown>>({})

// Media
const mediaIds = ref<string[]>([])

// Prompt content
const content = ref('')

// State
const saveSuccess = ref(false)
const isSaving = ref(false)

const showSaveError = computed({
  get: () => promptStore.saveError !== null,
  set: () => {},
})
const showModelWarning = ref(false)

// Computed
const canPublish = computed(() => {
  return title.value.trim() && priceThb.value !== null && priceThb.value > 0 && content.value.trim()
})

function onModelChange(val: ModelType) {
  if (title.value || description.value || content.value) {
    showModelWarning.value = true
  }
  modelType.value = val
}

function confirmModelChange() {
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

async function onSave(status: 'draft' | 'published') {
  const isFormValid = await refForm?.value?.validate()
  if (!isFormValid?.valid) return

  isSaving.value = true
  saveSuccess.value = false

  try {
    const result = await promptStore.createPrompt({
      title: title.value.trim(),
      description: description.value.trim(),
      price: thbToSatang(priceThb.value ?? 0),
      modelType: modelType.value,
      parameters: { ...parameters.value },
      content: content.value.trim(),
      status,
      mediaIds: mediaIds.value.length > 0 ? mediaIds.value : undefined,
    })

    saveSuccess.value = true

    if (status === 'published') {
      router.push(`/prompts/${result.id}`)
    }
    else {
      router.push('/prompts/mine')
    }
  }
  catch {
    // Error handled in store
  }
  finally {
    isSaving.value = false
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
              Create New Prompt
            </h4>
            <p class="text-body-2 text-medium-emphasis mb-0">
              Fill in the details below to create a new AI prompt
            </p>
          </div>
          <div class="d-flex gap-2">
            <VBtn
              variant="tonal"
              color="secondary"
              :disabled="!canPublish && false"
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
              Publish
            </VBtn>
          </div>
        </div>
      </VCol>
    </VRow>

    <!-- Form -->
    <VForm ref="refForm">
      <!-- Section 1: Basic Info -->
      <VCard class="mt-4">
        <VCardText>
          <h5 class="text-h5 mb-4">
            1. Basic Info
          </h5>
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

      <!-- Section 2: Model & Parameters -->
      <VCard class="mt-4">
        <VCardText>
          <h5 class="text-h5 mb-4">
            2. Model & Parameters
          </h5>

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

          <!-- Model Warning Dialog -->
          <VDialog
            v-model="showModelWarning"
            max-width="400"
          >
            <VCard>
              <VCardTitle class="text-h5">
                Change Model Type?
              </VCardTitle>
              <VCardText>
                <p class="text-body-1 mb-0">
                  Changing the model type will reset all parameter fields. Are you sure?
                </p>
              </VCardText>
              <VCardActions class="pa-4 pt-0">
                <VSpacer />
                <VBtn
                  variant="tonal"
                  color="secondary"
                  @click="cancelModelChange"
                >
                  Cancel
                </VBtn>
                <VBtn
                  color="warning"
                  @click="confirmModelChange"
                >
                  Reset Parameters
                </VBtn>
              </VCardActions>
            </VCard>
          </VDialog>

          <!-- Dynamic Parameters -->
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

      <!-- Section 3: Media Upload -->
      <VCard class="mt-4">
        <VCardText>
          <h5 class="text-h5 mb-4">
            3. Media Upload
          </h5>
          <PromptMediaUploader
            :existing-media="[]"
            :max-files="10"
            @update:media-ids="onMediaIdsUpdate"
          />
        </VCardText>
      </VCard>

      <!-- Section 4: Prompt Content -->
      <VCard class="mt-4">
        <VCardText>
          <h5 class="text-h5 mb-4">
            4. Prompt Content
          </h5>
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
                Use <code class="text-primary">[brackets]</code> for placeholders that buyers should customize.
              </p>
            </VCol>
          </VRow>
        </VCardText>
      </VCard>

      <!-- Bottom Actions -->
      <div class="d-flex justify-end gap-2 mt-4 mb-8">
        <VBtn
          variant="tonal"
          color="secondary"
          :loading="isSaving"
          :disabled="!canPublish && false"
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
          Publish
        </VBtn>
      </div>
    </VForm>

    <!-- Success Snackbar -->
    <VSnackbar
      v-model="saveSuccess"
      color="success"
      variant="tonal"
      timeout="3000"
    >
      Prompt saved successfully!
    </VSnackbar>

    <!-- Error Snackbar -->
    <VSnackbar
      v-model="showSaveError"
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
