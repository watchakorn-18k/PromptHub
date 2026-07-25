<script setup lang="ts">
import { PerfectScrollbar } from 'vue3-perfect-scrollbar'
import { useUserStore } from '@/stores/use-user-store'
import defaultAvatar from '@images/avatars/avatar-1.png'

const userStore = useUserStore()
const router = useRouter()

const userProfileList = [
  { type: 'divider' },
  {
    type: 'navItem',
    icon: 'ri-user-line',
    title: 'Profile',
    value: 'profile',
  },
  {
    type: 'navItem',
    icon: 'ri-settings-4-line',
    title: 'Settings',
    value: 'settings',
  },
  { type: 'divider' },
]

function navigateTo(value: string | undefined) {
  if (value === 'profile') {
    router.push('/profile')
  }
  else if (value === 'settings') {
    router.push('/profile')
  }
}

function onLogout() {
  userStore.logout()
  router.push('/login')
}

const userDisplayName = computed(() => userStore.currentUser?.display_name ?? 'User')
const userRole = computed(() => userStore.currentUser?.role ?? '—')
const userAvatar = computed(() => userStore.currentUser?.avatar_url ?? defaultAvatar)
const userEmail = computed(() => userStore.currentUser?.email ?? '')
</script>

<template>
  <VBadge
    dot
    bordered
    location="bottom right"
    offset-x="3"
    offset-y="3"
    color="success"
  >
    <VAvatar
      class="cursor-pointer"
      size="38"
    >
      <VImg
        v-if="userStore.currentUser?.avatar_url"
        :src="userAvatar"
        alt="Avatar"
      />
      <span
        v-else
        class="text-body-1 font-weight-bold text-primary"
      >
        {{ userDisplayName.charAt(0).toUpperCase() }}
      </span>

      <!-- User Menu -->
      <VMenu
        activator="parent"
        width="230"
        location="bottom end"
        offset="15px"
      >
        <VList>
          <!-- User Avatar & Name -->
          <VListItem>
            <template #prepend>
              <VListItemAction start>
                <VBadge
                  dot
                  location="bottom right"
                  offset-x="3"
                  offset-y="3"
                  color="success"
                >
                  <VAvatar
                    color="primary"
                    variant="tonal"
                  >
                    <VImg
                      v-if="userStore.currentUser?.avatar_url"
                      :src="userAvatar"
                    />
                    <span
                      v-else
                      class="text-h6 font-weight-bold text-primary"
                    >
                      {{ userDisplayName.charAt(0).toUpperCase() }}
                    </span>
                  </VAvatar>
                </VBadge>
              </VListItemAction>
            </template>

            <h6 class="text-sm font-weight-medium">
              {{ userDisplayName }}
            </h6>
            <VListItemSubtitle class="text-capitalize text-disabled">
              {{ userRole }}
            </VListItemSubtitle>
          </VListItem>

          <PerfectScrollbar :options="{ wheelPropagation: false }">
            <template
              v-for="item in userProfileList"
              :key="item.title"
            >
              <VListItem
                v-if="item.type === 'navItem'"
                :value="item.value"
                @click="navigateTo(item.value)"
              >
                <template #prepend>
                  <VIcon
                    :icon="item.icon"
                    size="22"
                  />
                </template>

                <VListItemTitle>{{ item.title }}</VListItemTitle>
              </VListItem>

              <VDivider
                v-else
                class="my-1"
              />
            </template>

            <VListItem @click="onLogout">
              <VBtn
                block
                color="error"
                append-icon="ri-logout-box-r-line"
              >
                Logout
              </VBtn>
            </VListItem>
          </PerfectScrollbar>
        </VList>
      </VMenu>
    </VAvatar>
  </VBadge>
</template>
