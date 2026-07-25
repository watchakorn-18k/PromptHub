<script setup lang="ts">
import { mediaApi } from '@/apis/media-api'
import type { PromptMedia } from '@/models/prompt'

const props = withDefaults(defineProps<{
  existingMedia?: PromptMedia[]
  maxFiles?: number
}>(), {
  existingMedia: () => [],
  maxFiles: 10,
})

const emit = defineEmits<{
  'update:mediaIds': [ids: string[]]
}>()

// Track uploaded media
const mediaItems = ref<PromptMedia[]>([...props.existingMedia])
const uploadedIds = ref<string[]>(props.existingMedia.map(m => m.id))

// Upload progress tracking
interface UploadQueueItem {
  file: File
  progress: number
  error?: string
}

const uploadQueue = ref<UploadQueueItem[]>([])

const dragOver = ref(false)
const fileInputRef = ref<HTMLInputElement>()

const remainingSlots = computed(() => props.maxFiles - mediaItems.value.length)

function notifyIds() {
  emit('update:mediaIds', [...uploadedIds.value])
}

function openFilePicker() {
  fileInputRef.value?.click()
}

function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  if (!target.files?.length) return
  processFiles(Array.from(target.files))
  target.value = '' // Reset for re-selection
}

function onDrop(event: DragEvent) {
  dragOver.value = false
  if (!event.dataTransfer?.files?.length) return
  processFiles(Array.from(event.dataTransfer.files))
}

function processFiles(files: File[]) {
  const validFiles = files.filter(f => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']
    if (!validTypes.includes(f.type)) {
      return false
    }
    if (f.size > 50 * 1024 * 1024) {
      return false
    }
    return true
  }).slice(0, remainingSlots.value)

  for (const file of validFiles) {
    const mediaType = file.type.startsWith('video/') ? 'video' : 'image'
    uploadFile(file, mediaType)
  }
}

async function uploadFile(file: File, mediaType: 'image' | 'video') {
  const queueItem = ref<UploadQueueItem>({ file, progress: 0 })
  uploadQueue.value.push(queueItem.value)

  try {
    // Simulate progress for better UX (real progress tracking would need xhr)
    const progressInterval = setInterval(() => {
      if (queueItem.value.progress < 90) {
        queueItem.value.progress += Math.random() * 15
      }
    }, 300)

    const res = await mediaApi.upload(file, mediaType)
    clearInterval(progressInterval)
    queueItem.value.progress = 100

    // Add to media list
    mediaItems.value.push(res.data)
    uploadedIds.value.push(res.data.id)
    notifyIds()

    // Remove from queue after brief delay
    setTimeout(() => {
      const idx = uploadQueue.value.indexOf(queueItem.value)
      if (idx !== -1) uploadQueue.value.splice(idx, 1)
    }, 1000)
  }
  catch (e: any) {
    queueItem.value.error = e.message || 'Upload failed'
    // Keep in queue with error state for 3s then remove
    setTimeout(() => {
      const idx = uploadQueue.value.indexOf(queueItem.value)
      if (idx !== -1) uploadQueue.value.splice(idx, 1)
    }, 3000)
  }
}

function removeMedia(mediaId: string) {
  mediaItems.value = mediaItems.value.filter(m => m.id !== mediaId)
  uploadedIds.value = uploadedIds.value.filter(id => id !== mediaId)
  notifyIds()
}
</script>

<template>
  <div>
    <!-- Existing / Uploaded Media Thumbnails -->
    <div
      v-if="mediaItems.length > 0"
      class="d-flex flex-wrap gap-2 mb-3"
    >
      <div
        v-for="item in mediaItems"
        :key="item.id"
        class="media-thumb"
      >
        <VImg
          v-if="item.mediaType === 'image'"
          :src="item.url"
          width="100"
          height="100"
          cover
          class="rounded"
        />
        <div
          v-else
          class="d-flex align-center justify-center bg-grey-lighten-3 rounded"
          style="width: 100px; height: 100px;"
        >
          <VIcon icon="ri-video-line" size="32" color="grey" />
        </div>
        <VBtn
          icon
          size="x-small"
          color="error"
          class="media-thumb__remove"
          @click="removeMedia(item.id)"
        >
          <VIcon icon="ri-close-line" size="14" />
        </VBtn>
      </div>
    </div>

    <!-- Upload Queue (Progress) -->
    <div
      v-for="item in uploadQueue"
      :key="item.file.name"
      class="mb-2"
    >
      <div class="d-flex align-center justify-space-between text-body-2 mb-1">
        <span class="text-truncate me-2">{{ item.file.name }}</span>
        <span
          v-if="item.error"
          class="text-error"
        >{{ item.error }}</span>
        <span v-else>{{ Math.round(item.progress) }}%</span>
      </div>
      <VProgressLinear
        :model-value="item.progress"
        :color="item.error ? 'error' : 'primary'"
        height="4"
        rounded
      />
    </div>

    <!-- Drop Zone -->
    <div
      v-if="remainingSlots > 0"
      class="upload-zone border-dashed rounded pa-6 text-center"
      :class="{ 'upload-zone--dragover': dragOver }"
      @dragover.prevent="dragOver = true"
      @dragleave.prevent="dragOver = false"
      @drop.prevent="onDrop"
      @click="openFilePicker"
    >
      <input
        ref="fileInputRef"
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
        class="d-none"
        @change="onFileChange"
      />

      <VIcon
        icon="ri-upload-cloud-2-line"
        size="36"
        :color="dragOver ? 'primary' : 'grey'"
        class="mb-2"
      />
      <p class="text-body-2 mb-1">
        <span class="text-primary font-weight-medium text-decoration-underline cursor-pointer">Click to upload</span>
        or drag and drop
      </p>
      <p class="text-caption text-medium-emphasis">
        JPG, PNG, WebP, GIF, MP4, WebM (max 50MB)
      </p>
    </div>
  </div>
</template>

<style scoped>
.media-thumb {
  position: relative;
  width: 100px;
  height: 100px;
}
.media-thumb__remove {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: unset;
  width: 22px;
  height: 22px;
}
.upload-zone {
  border: 2px dashed rgb(var(--v-theme-border));
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.2s, background-color 0.2s;
}
.upload-zone:hover,
.upload-zone--dragover {
  border-color: rgb(var(--v-theme-primary));
  background-color: rgba(var(--v-theme-primary), 0.04);
}
</style>
