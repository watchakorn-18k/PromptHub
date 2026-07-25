import type { UpdateUserInput, User } from '../entities/user'

export interface CreateUserData {
  email: string
  name: string
  displayName: string
  role: string
  passwordHash: string
}

export interface UserRepository {
  findAll(): Promise<User[]>
  findById(id: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  create(input: CreateUserData): Promise<User>
  update(id: string, input: UpdateUserInput): Promise<User | null>
  delete(id: string): Promise<boolean>
}
