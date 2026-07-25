<script setup lang="ts">
withDefaults(defineProps<{
  content: string
  isLocked?: boolean
}>(), {
  isLocked: false,
})
</script>

<template>
  <div>
    <VCard
      v-if="isLocked"
      variant="tonal"
      color="warning"
      class="text-center pa-4"
    >
      <VIcon icon="ri-lock-line" size="32" color="warning" class="mb-2" />
      <h6 class="text-h6 mb-1">Content Locked</h6>
      <p class="text-body-2 text-medium-emphasis mb-0">
        Purchase this prompt to unlock the full content.
      </p>
    </VCard>
    <div v-else>
      <div class="bg-grey-lighten-4 pa-4 rounded-lg">
        <pre class="text-body-2 mb-0" style="white-space: pre-wrap; word-break: break-word;">{{ content }}</pre>
      </div>
      <p class="text-caption text-medium-emphasis mt-2">
        <VIcon icon="ri-information-line" size="14" class="me-1" />
        Use <code class="text-primary">[brackets]</code> as placeholders that you can customize for your own use.
      </p>
    </div>
  </div>
</template>
