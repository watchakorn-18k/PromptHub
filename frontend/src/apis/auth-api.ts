import type {
  AuthResponse,
  LoginBody,
  MeResponse,
  RegisterBody,
  UpdateProfileBody,
} from '@/models'
import { request } from './request'

const BASE = `${import.meta.env.VITE_BACKEND_URL}/api/v1/auth`

export const authApi = {
  login: (body: LoginBody) =>
    request<AuthResponse>(`${BASE}/login`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  register: (body: RegisterBody) =>
    request<AuthResponse>(`${BASE}/register`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  me: () =>
    request<MeResponse>(`${BASE}/me`),

  updateProfile: (body: UpdateProfileBody) =>
    request<MeResponse>(`${BASE}/me`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  refresh: (refreshToken: string) =>
    request<{ access_token: string }>(`${BASE}/refresh`, {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    }),

  logout: () =>
    request<void>(`${BASE}/logout`, { method: 'POST' }),
}
