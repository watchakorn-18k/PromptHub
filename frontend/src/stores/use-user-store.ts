import { defineStore } from 'pinia'
import { jwtDecode } from 'jwt-decode'
import { authApi } from '@/apis/auth-api'
import { userApi } from '@/apis/user-api'
import { setToken, clearToken } from '@/apis/request'
import type { CreateUserBody, LoginBody, RegisterBody, UpdateProfileBody, UpdateUserBody, User, UserRole } from '@/models'

/* ── Helpers ── */

function loadToken(): string | null {
  try {
    return localStorage.getItem('auth-token')
  }
  catch {
    return null
  }
}

function isTokenExpired(token: string): boolean {
  try {
    const decoded: any = jwtDecode(token)
    return decoded.exp * 1000 < Date.now()
  }
  catch {
    return true
  }
}

export const useUserStore = defineStore('UserStore', () => {
  /* ── Auth State ── */
  const currentUser = ref<User | null>(null)
  const token = ref<string | null>(loadToken())
  const isAuthLoading = ref(false)
  const authError = ref<string | null>(null)

  /* ── Computed ── */
  const isAuthenticated = computed(() => {
    if (!token.value)
      return false
    if (isTokenExpired(token.value))
      return false
    return true
  })

  const userRole = computed<UserRole | null>(() => currentUser.value?.role ?? null)

  /* ── Auth Actions ── */

  async function login(body: LoginBody) {
    isAuthLoading.value = true
    authError.value = null
    try {
      const res = await authApi.login(body)
      token.value = res.access_token
      setToken(res.access_token)
      currentUser.value = res.user
    }
    catch (e: any) {
      authError.value = e.message
      throw e
    }
    finally {
      isAuthLoading.value = false
    }
  }

  async function register(body: RegisterBody) {
    isAuthLoading.value = true
    authError.value = null
    try {
      const res = await authApi.register(body)
      token.value = res.access_token
      setToken(res.access_token)
      currentUser.value = res.user
    }
    catch (e: any) {
      authError.value = e.message
      throw e
    }
    finally {
      isAuthLoading.value = false
    }
  }

  async function fetchMe() {
    if (!token.value)
      return
    isAuthLoading.value = true
    authError.value = null
    try {
      const res = await authApi.me()
      currentUser.value = res.data
    }
    catch (e: any) {
      authError.value = e.message
      // If 401, clear auth
      if (e.message?.includes('401') || e.message?.toLowerCase().includes('unauthorized')) {
        logout()
      }
    }
    finally {
      isAuthLoading.value = false
    }
  }

  async function updateProfile(body: UpdateProfileBody) {
    isAuthLoading.value = true
    authError.value = null
    try {
      const res = await authApi.updateProfile(body)
      currentUser.value = res.data
    }
    catch (e: any) {
      authError.value = e.message
      throw e
    }
    finally {
      isAuthLoading.value = false
    }
  }

  function logout() {
    token.value = null
    currentUser.value = null
    clearToken()
  }

  /* ── Admin User CRUD State ── */
  const users = ref<User[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  /* ── Admin User CRUD Actions ── */

  async function fetchUsers() {
    isLoading.value = true
    error.value = null
    try {
      const res = await userApi.list()
      users.value = res.data
    }
    catch (e: any) {
      error.value = e.message
    }
    finally {
      isLoading.value = false
    }
  }

  async function createUser(body: CreateUserBody) {
    const res = await userApi.create(body)
    users.value.unshift(res.data)
    return res.data
  }

  async function updateUser(id: string, body: UpdateUserBody) {
    const res = await userApi.update(id, body)
    const idx = users.value.findIndex(u => u.id === id)
    if (idx !== -1)
      users.value[idx] = res.data
    return res.data
  }

  async function deleteUser(id: string) {
    await userApi.remove(id)
    users.value = users.value.filter(u => u.id !== id)
  }

  return {
    // Auth state
    currentUser,
    token,
    isAuthLoading,
    authError,
    isAuthenticated,
    userRole,
    // Auth actions
    login,
    register,
    fetchMe,
    updateProfile,
    logout,
    // Admin CRUD state
    users,
    isLoading,
    error,
    // Admin CRUD actions
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
  }
})
