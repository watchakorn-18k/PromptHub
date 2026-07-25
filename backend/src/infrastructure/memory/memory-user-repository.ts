
import type { UpdateUserInput, User } from '../../domain/entities/user'
import type { CreateUserData, UserRepository } from '../../domain/repositories/user-repository'

// Reference implementation for runtimes without D1 (AWS Lambda, local tests).
export class MemoryUserRepository implements UserRepository {
  private readonly users = new Map<string, User>()

  async findAll(): Promise<User[]> {
    return [...this.users.values()]
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null
  }

  async findByEmail(email: string): Promise<User | null> {
    return [...this.users.values()].find((u) => u.email === email) ?? null
  }

  async create(input: CreateUserData): Promise<User> {
    const now = new Date().toISOString()
    const user: User = {
      id: crypto.randomUUID(),
      email: input.email,
      name: input.name,
      displayName: input.displayName,
      avatarUrl: undefined,
      bio: undefined,
      role: input.role as User['role'],
      passwordHash: input.passwordHash,
      createdAt: now,
      updatedAt: now,
    }
    this.users.set(user.id, user)
    return user
  }

  async update(id: string, input: UpdateUserInput): Promise<User | null> {
    const existing = this.users.get(id)
    if (!existing) return null
    const updated: User = {
      ...existing,
      email: input.email ?? existing.email,
      name: input.name ?? existing.name,
      displayName: input.displayName ?? existing.displayName,
      avatarUrl: input.avatarUrl ?? existing.avatarUrl,
      bio: input.bio ?? existing.bio,
      updatedAt: new Date().toISOString(),
    }
    this.users.set(id, updated)
    return updated
  }

  async delete(id: string): Promise<boolean> {
    return this.users.delete(id)
  }
}
