export type UserRole = 'admin' | 'creator' | 'buyer'

export interface User {
  id: string
  email: string
  name: string
  displayName: string
  avatarUrl?: string
  bio?: string
  role: UserRole
  passwordHash: string
  createdAt: string
  updatedAt: string
}

// Public profile — ไม่มี passwordHash
export type UserPublic = Pick<User, 'id' | 'email' | 'name' | 'displayName' | 'avatarUrl' | 'bio' | 'role' | 'createdAt'>

export interface CreateUserInput {
  email: string
  name: string
  displayName?: string
  role?: UserRole
  password: string
}

export interface UpdateUserInput {
  email?: string
  name?: string
  displayName?: string
  avatarUrl?: string
  bio?: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface AuthResponse {
  user: UserPublic
  accessToken: string
  refreshToken: string
}
