<script setup lang="ts">
import { VNodeRenderer } from '@layouts/components/VNodeRenderer'
import { themeConfig } from '@themeConfig'
import { useUserStore } from '@/stores/use-user-store'
import type { UserRole } from '@/models'

import miscMaskDark from '@images/misc/misc-mask-dark.png'
import miscMaskLight from '@images/misc/misc-mask-light.png'
import tree1 from '@images/misc/tree1.png'
import tree3 from '@images/misc/tree3.png'

import { VForm } from 'vuetify/components'

definePage({
  meta: {
    layout: 'blank',
    unauthenticatedOnly: true,
  },
})

const router = useRouter()
const userStore = useUserStore()
const authThemeMask = useGenerateImageVariant(miscMaskLight, miscMaskDark)

const refRegisterForm = ref<VForm>()
const isPasswordVisible = ref(false)
const isConfirmPasswordVisible = ref(false)

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const displayName = ref('')
const role = ref<UserRole>('buyer')
const registerError = ref<string | null>(null)

const roleOptions = [
  { title: 'Buyer', value: 'buyer' as UserRole, subtitle: 'Browse and purchase prompts' },
  { title: 'Creator', value: 'creator' as UserRole, subtitle: 'Create and sell prompts' },
]

const passwordRules = [
  (v: string) => !!v || 'Password is required',
  (v: string) => v.length >= 6 || 'Password must be at least 6 characters',
]

const confirmPasswordRules = [
  (v: string) => !!v || 'Please confirm your password',
  (v: string) => v === password.value || 'Passwords do not match',
]

async function onClickRegister() {
  const isFormValid = await refRegisterForm?.value?.validate()
  if (!isFormValid?.valid)
    return

  registerError.value = null
  try {
    await userStore.register({
      email: email.value,
      password: password.value,
      display_name: displayName.value,
      role: role.value,
    })
    router.push('/')
  }
  catch (e: any) {
    registerError.value = e.message || 'Registration failed. Please try again.'
  }
}
</script>

<template>
  <div class="auth-wrapper d-flex align-center justify-center pa-4">
    <VCard class="auth-card pa-sm-4 pa-md-7 pa-0" min-width="520">
      <VCardText>
        <div class="d-flex align-center gap-x-3 justify-center mb-6">
          <VNodeRenderer :nodes="themeConfig.app.logo" />

          <h1 class="auth-title">
            {{ themeConfig.app.title.toLocaleUpperCase() }}
          </h1>
        </div>
        <p class="mb-0 text-center text-medium-emphasis">
          Create your account
        </p>
      </VCardText>

      <VCardText>
        <VForm ref="refRegisterForm" @submit.prevent="onClickRegister">
          <VRow>
            <VCol cols="12">
              <VTextField
                v-model="displayName"
                autofocus
                label="Display Name"
                placeholder="Your name"
                :rules="[requiredValidator]"
                clearable
              />
            </VCol>

            <VCol cols="12">
              <VTextField
                v-model="email"
                label="Email"
                type="email"
                placeholder="your@email.com"
                :rules="[requiredValidator, emailValidator]"
                clearable
              />
            </VCol>

            <VCol cols="12" md="6">
              <VTextField
                v-model="password"
                label="Password"
                placeholder="············"
                :rules="passwordRules"
                :type="isPasswordVisible ? 'text' : 'password'"
                :append-inner-icon="isPasswordVisible ? 'ri-eye-off-line' : 'ri-eye-line'"
                @click:append-inner="isPasswordVisible = !isPasswordVisible"
              />
            </VCol>

            <VCol cols="12" md="6">
              <VTextField
                v-model="confirmPassword"
                label="Confirm Password"
                placeholder="············"
                :rules="confirmPasswordRules"
                :type="isConfirmPasswordVisible ? 'text' : 'password'"
                :append-inner-icon="isConfirmPasswordVisible ? 'ri-eye-off-line' : 'ri-eye-line'"
                @click:append-inner="isConfirmPasswordVisible = !isConfirmPasswordVisible"
              />
            </VCol>

            <VCol cols="12">
              <label class="text-body-2 font-weight-medium d-block mb-2">
                I want to...
              </label>
              <VRadioGroup
                v-model="role"
                inline
                hide-details
              >
                <VRadio
                  v-for="opt in roleOptions"
                  :key="opt.value"
                  :label="opt.title"
                  :value="opt.value"
                  :subtitle="opt.subtitle"
                />
              </VRadioGroup>
            </VCol>

            <VCol cols="12">
              <VAlert
                v-if="registerError"
                color="error"
                variant="tonal"
                closable
                density="compact"
                @click:close="registerError = null"
              >
                {{ registerError }}
              </VAlert>

              <VBtn
                block
                type="submit"
                :loading="userStore.isAuthLoading"
                class="mt-2"
              >
                Create Account
              </VBtn>
            </VCol>

            <VCol cols="12" class="text-center text-body-2">
              Already have an account?
              <RouterLink
                :to="{ name: 'login' }"
                class="text-primary font-weight-medium text-decoration-none"
              >
                Sign in
              </RouterLink>
            </VCol>
          </VRow>
        </VForm>
      </VCardText>
    </VCard>

    <div class="d-flex gap-x-2 auth-footer-start-tree">
      <img class="d-none d-md-block" :src="tree3" :height="120" :width="67">
      <img
        class="d-none d-md-block align-self-end"
        :src="tree3"
        :height="70"
        :width="40"
      >
    </div>

    <img
      :src="tree1"
      class="auth-footer-end-tree d-none d-md-block"
      :width="97"
      :height="210"
    >

    <img
      class="auth-footer-mask d-none d-md-block"
      :src="authThemeMask"
      height="172"
    >
  </div>
</template>

<style lang="scss">
@use "@core/scss/template/pages/page-auth.scss";
</style>
