<script setup lang="ts">
import type { ModelType, ParameterField } from '@/models/prompt'
import { modelParameterSchemas } from '@/models/prompt'

const props = withDefaults(defineProps<{
  modelType: ModelType
  parameters?: Record<string, unknown>
}>(), {
  parameters: () => ({}),
})

const emit = defineEmits<{
  'update:parameters': [value: Record<string, unknown>]
}>()

// Build initial parameter values from schema defaults + existing props
function buildInitialParams(): Record<string, unknown> {
  const schema = modelParameterSchemas[props.modelType]
  if (!schema) return {}

  const params: Record<string, unknown> = {}
  for (const field of schema) {
    params[field.key] = props.parameters?.[field.key] ?? field.defaultValue
  }
  return params
}

const parameters = ref<Record<string, any>>(buildInitialParams())

// Watch for model type changes and rebuild params
watch(() => props.modelType, () => {
  parameters.value = buildInitialParams()
  emitParams()
})

// Watch for external parameters changes (edit mode)
watch(() => props.parameters, (val) => {
  if (val && Object.keys(val).length > 0) {
    const schema = modelParameterSchemas[props.modelType]
    if (!schema) return
    const merged: Record<string, unknown> = {}
    for (const field of schema) {
      merged[field.key] = val[field.key] ?? field.defaultValue
    }
    parameters.value = merged
  }
}, { deep: true })

const currentSchema = computed<ParameterField[]>(() => {
  return modelParameterSchemas[props.modelType] ?? []
})

function emitParams() {
  emit('update:parameters', { ...parameters.value })
}

function updateParam(key: string, value: unknown) {
  parameters.value[key] = value
  emitParams()
}
</script>

<template>
  <div>
    <VRow>
      <template
        v-for="field in currentSchema"
        :key="field.key"
      >
        <!-- Select field -->
        <VCol
          v-if="field.type === 'select'"
          cols="12"
          sm="6"
        >
          <VSelect
            :model-value="parameters[field.key]"
            :label="field.label"
            :items="field.options ?? []"
            density="comfortable"
            hide-details="auto"
            variant="outlined"
            @update:model-value="(val) => updateParam(field.key, val)"
          />
        </VCol>

        <!-- Range/Slider field -->
        <VCol
          v-else-if="field.type === 'range'"
          cols="12"
          sm="6"
        >
          <label class="text-body-2 mb-1 d-block">{{ field.label }}: <strong>{{ parameters[field.key] }}</strong></label>
          <VSlider
            :model-value="Number(parameters[field.key] ?? field.defaultValue)"
            :min="field.min ?? 0"
            :max="field.max ?? 100"
            :step="field.step ?? 1"
            hide-details
            density="compact"
            @update:model-value="(val) => updateParam(field.key, val)"
          />
        </VCol>

        <!-- Boolean / Switch field -->
        <VCol
          v-else-if="field.type === 'boolean'"
          cols="12"
          sm="6"
        >
          <VSwitch
            :model-value="Boolean(parameters[field.key] ?? field.defaultValue)"
            :label="field.label"
            density="compact"
            hide-details
            color="primary"
            @update:model-value="(val) => updateParam(field.key, val)"
          />
        </VCol>

        <!-- Textarea field -->
        <VCol
          v-else-if="field.type === 'textarea'"
          cols="12"
        >
          <VTextarea
            :model-value="String(parameters[field.key] ?? field.defaultValue ?? '')"
            :label="field.label"
            rows="3"
            auto-grow
            density="comfortable"
            hide-details="auto"
            variant="outlined"
            @update:model-value="(val) => updateParam(field.key, val)"
          />
        </VCol>

        <!-- Number field -->
        <VCol
          v-else-if="field.type === 'number'"
          cols="12"
          sm="6"
        >
          <VTextField
            :model-value="parameters[field.key]"
            :label="field.label"
            type="number"
            :min="field.min"
            :max="field.max"
            :step="field.step"
            density="comfortable"
            hide-details="auto"
            variant="outlined"
            @update:model-value="(val) => updateParam(field.key, val === '' ? null : Number(val))"
          />
        </VCol>

        <!-- Text field -->
        <VCol
          v-else
          cols="12"
          sm="6"
        >
          <VTextField
            :model-value="String(parameters[field.key] ?? field.defaultValue ?? '')"
            :label="field.label"
            density="comfortable"
            hide-details="auto"
            variant="outlined"
            @update:model-value="(val) => updateParam(field.key, val)"
          />
        </VCol>
      </template>
    </VRow>
  </div>
</template>
