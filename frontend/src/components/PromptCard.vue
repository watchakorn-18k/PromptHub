<script setup lang="ts">
import type { PromptListItem } from '@/models/prompt'
import { satangToThb } from '@/models/prompt'
import ModelBadge from '@/components/ModelBadge.vue'

const props = defineProps<{
  prompt: PromptListItem
}>()

const router = useRouter()

const previewImage = computed(() => {
  if (props.prompt.previewMedia?.length > 0) {
    return props.prompt.previewMedia[0].url
  }
  return null
})

function goToDetail() {
  router.push(`/prompts/${props.prompt.id}`)
}
</script>

<template>
  <VCard
    class="prompt-card cursor-pointer"
    @click="goToDetail"
  >
    <!-- Preview Image -->
    <div class="prompt-card__image">
      <VImg
        v-if="previewImage"
        :src="previewImage"
        height="180"
        cover
        class="bg-grey-lighten-3"
      />
      <div
        v-else
        class="d-flex align-center justify-center bg-grey-lighten-3"
        style="height: 180px;"
      >
        <VIcon
          icon="ri-image-line"
          size="48"
          color="grey-lighten-1"
        />
      </div>
    </div>

    <VCardText>
      <!-- Model Badge -->
      <div class="d-flex align-center mb-1">
        <ModelBadge :model-type="prompt.modelType" />
      </div>

      <!-- Title -->
      <h6 class="text-h6 text-truncate mb-1">
        {{ prompt.title }}
      </h6>

      <!-- Creator -->
      <div class="d-flex align-center text-body-2 text-medium-emphasis mb-2">
        <VAvatar
          size="20"
          class="me-1"
        >
          <VImg
            v-if="prompt.creator?.avatarUrl"
            :src="prompt.creator.avatarUrl"
          />
          <span v-else class="text-caption">{{ (prompt.creator?.displayName ?? '?')[0] }}</span>
        </VAvatar>
        <span class="text-truncate">{{ prompt.creator?.displayName ?? 'Unknown' }}</span>
      </div>

      <!-- Price -->
      <div class="d-flex align-center justify-space-between">
        <span class="text-primary text-h6 font-weight-bold">
          ฿{{ satangToThb(prompt.price).toLocaleString() }}
        </span>
      </div>
    </VCardText>
  </VCard>
</template>

<style scoped>
.prompt-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.prompt-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}
.prompt-card__image {
  overflow: hidden;
  border-radius: 6px 6px 0 0;
}
</style>
