export type UserRole = 'admin' | 'creator' | 'buyer'

export interface User {
  id: string
  email: string
  name: string
  display_name?: string
  avatar_url?: string
  bio?: string
  role: UserRole
  password_hash?: string
  createdAt: string
  updatedAt?: string
}

export interface CreateUserBody {
  email: string
  name: string
}

export interface UpdateUserBody {
  email?: string
  name?: string
}

export interface UserListResponse {
  data: User[]
}

export interface UserResponse {
  data: User
}

/* ── Auth Types ── */

export interface LoginBody {
  email: string
  password: string
}

export interface RegisterBody {
  email: string
  password: string
  display_name: string
  role?: UserRole
}

export interface UpdateProfileBody {
  name?: string
  display_name?: string
  avatar_url?: string
  bio?: string
}

export interface AuthResponse {
  user: User
  access_token: string
  refresh_token?: string
}

export interface MeResponse {
  data: User
}
