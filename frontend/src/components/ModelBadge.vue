<script setup lang="ts">
import type { ModelType } from '@/models/prompt'
import { modelColors, modelLabels } from '@/models/prompt'

const props = defineProps<{
  modelType: ModelType
}>()
</script>

<template>
  <VChip
    size="x-small"
    :color="modelColors[props.modelType]"
    variant="tonal"
    class="font-weight-medium text-capitalize"
  >
    {{ modelLabels[props.modelType] }}
  </VChip>
</template>
