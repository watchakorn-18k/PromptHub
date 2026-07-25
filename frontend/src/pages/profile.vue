<script setup lang="ts">
import { useUserStore } from '@/stores/use-user-store'
import { VForm } from 'vuetify/components'

definePage({
  meta: {
    title: 'Profile',
  },
})

const userStore = useUserStore()
const router = useRouter()

const refProfileForm = ref<VForm>()

const displayName = ref(userStore.currentUser?.display_name ?? '')
const bio = ref(userStore.currentUser?.bio ?? '')
const avatarUrl = ref(userStore.currentUser?.avatar_url ?? '')

const saveSuccess = ref(false)
const saveError = ref<string | null>(null)
const isSaving = ref(false)

// Available avatars - use Vite glob for reliable asset resolution
const avatarModules = import.meta.glob<string>('/src/assets/images/avatars/avatar-*.png', {
  eager: true,
  query: '?url',
  import: 'default',
})

const avatarOptions = Object.entries(avatarModules)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([path, url]) => ({
    path,
    url,
  }))

watchEffect(() => {
  if (userStore.currentUser) {
    displayName.value = userStore.currentUser.display_name ?? ''
    bio.value = userStore.currentUser.bio ?? ''
    avatarUrl.value = userStore.currentUser.avatar_url ?? ''
  }
})

async function onSave() {
  const isFormValid = await refProfileForm?.value?.validate()
  if (!isFormValid?.valid)
    return

  isSaving.value = true
  saveSuccess.value = false
  saveError.value = null

  try {
    await userStore.updateProfile({
      display_name: displayName.value,
      bio: bio.value,
      avatar_url: avatarUrl.value || undefined,
    })
    saveSuccess.value = true
  }
  catch (e: any) {
    saveError.value = e.message || 'Failed to update profile.'
  }
  finally {
    isSaving.value = false
  }
}

async function onLogout() {
  userStore.logout()
  router.push('/login')
}
</script>

<template>
  <div>
    <VRow>
      <VCol cols="12">
        <h4 class="text-h4 mb-1">
          My Profile
        </h4>
        <p class="text-body-2 text-medium-emphasis mb-6">
          Manage your account information
        </p>
      </VCol>
    </VRow>

    <VRow>
      <!-- Avatar & Info Card -->
      <VCol cols="12" md="4">
        <VCard>
          <VCardText class="d-flex flex-column align-center py-6">
            <VAvatar
              size="120"
              color="primary"
              variant="tonal"
              class="mb-4"
            >
              <VImg
                v-if="avatarUrl"
                :src="avatarUrl"
                alt="Avatar"
              />
              <span
                v-else
                class="text-h3 font-weight-medium text-primary"
              >
                {{ (userStore.currentUser?.display_name ?? '?').charAt(0).toUpperCase() }}
              </span>
            </VAvatar>

            <h5 class="text-h5 font-weight-medium mb-1">
              {{ userStore.currentUser?.display_name ?? 'User' }}
            </h5>
            <VChip
              size="small"
              color="primary"
              variant="tonal"
              class="mb-2 text-capitalize"
            >
              {{ userStore.currentUser?.role ?? '—' }}
            </VChip>
            <p class="text-body-2 text-medium-emphasis mb-0">
              {{ userStore.currentUser?.email }}
            </p>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Profile Form -->
      <VCol cols="12" md="8">
        <VCard>
          <VCardText>
            <h5 class="text-h5 mb-4">
              Profile Details
            </h5>

            <VForm ref="refProfileForm" @submit.prevent="onSave">
              <VRow>
                <VCol cols="12">
                  <VTextField
                    v-model="displayName"
                    label="Display Name"
                    placeholder="Your display name"
                    :rules="[requiredValidator]"
                    clearable
                  />
                </VCol>

                <VCol cols="12">
                  <VTextarea
                    v-model="bio"
                    label="Bio"
                    placeholder="Tell us about yourself..."
                    rows="3"
                    auto-grow
                    clearable
                    counter
                    maxlength="500"
                  />
                </VCol>

                <VCol cols="12">
                  <label class="text-body-2 font-weight-medium d-block mb-2">
                    Avatar
                  </label>
                  <VRow dense>
                    <VCol
                      v-for="av in avatarOptions"
                      :key="av.path"
                      cols="3"
                      sm="2"
                      md="1.5"
                    >
                      <VAvatar
                        size="56"
                        class="cursor-pointer"
                        :class="{
                          'ring ring-primary': avatarUrl === av.url,
                          'opacity-50': avatarUrl && avatarUrl !== av.url,
                        }"
                        @click="avatarUrl = av.url"
                      >
                        <VImg :src="av.url" />
                      </VAvatar>
                    </VCol>
                  </VRow>
                </VCol>

                <VCol cols="12">
                  <VAlert
                    v-if="saveSuccess"
                    color="success"
                    variant="tonal"
                    closable
                    density="compact"
                    class="mb-4"
                    @click:close="saveSuccess = false"
                  >
                    Profile updated successfully.
                  </VAlert>

                  <VAlert
                    v-if="saveError"
                    color="error"
                    variant="tonal"
                    closable
                    density="compact"
                    class="mb-4"
                    @click:close="saveError = null"
                  >
                    {{ saveError }}
                  </VAlert>

                  <div class="d-flex gap-4">
                    <VBtn
                      type="submit"
                      :loading="isSaving"
                      color="primary"
                    >
                      Save Changes
                    </VBtn>

                    <VBtn
                      variant="outlined"
                      color="error"
                      prepend-icon="ri-logout-box-r-line"
                      @click="onLogout"
                    >
                      Logout
                    </VBtn>
                  </div>
                </VCol>
              </VRow>
            </VForm>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>
  </div>
</template>

<style scoped>
.ring {
  border-radius: 50%;
}
.opacity-50 {
  opacity: 0.5;
  transition: opacity 0.2s ease;
}
.opacity-50:hover {
  opacity: 0.8;
}
</style>
