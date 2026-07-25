
import type { UpdateUserInput, User } from '../../domain/entities/user'
import type { UserRepository } from '../../domain/repositories/user-repository'

interface UserRow {
  id: string
  email: string
  name: string
  display_name: string
  avatar_url: string | null
  bio: string | null
  role: string
  password_hash: string
  created_at: string
  updated_at: string
}

function toUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    displayName: row.display_name,
    avatarUrl: row.avatar_url ?? undefined,
    bio: row.bio ?? undefined,
    role: row.role as User['role'],
    passwordHash: row.password_hash,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

const SELECT_FIELDS = 'id, email, name, display_name, avatar_url, bio, role, password_hash, created_at, updated_at'

export class D1UserRepository implements UserRepository {
  constructor(private readonly db: D1Database) {}

  async findAll(): Promise<User[]> {
    const { results } = await this.db
      .prepare(`SELECT ${SELECT_FIELDS} FROM users ORDER BY created_at DESC`)
      .all<UserRow>()
    return results.map(toUser)
  }

  async findById(id: string): Promise<User | null> {
    const row = await this.db
      .prepare(`SELECT ${SELECT_FIELDS} FROM users WHERE id = ?`)
      .bind(id)
      .first<UserRow>()
    return row ? toUser(row) : null
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.db
      .prepare(`SELECT ${SELECT_FIELDS} FROM users WHERE email = ?`)
      .bind(email)
      .first<UserRow>()
    return row ? toUser(row) : null
  }

  async create(input: { email: string; name: string; displayName: string; role: string; passwordHash: string }): Promise<User> {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()

    await this.db
      .prepare(
        'INSERT INTO users (id, email, name, display_name, avatar_url, bio, role, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      )
      .bind(id, input.email, input.name, input.displayName, null, null, input.role, input.passwordHash, now, now)
      .run()

    return {
      id,
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
  }

  async update(id: string, input: UpdateUserInput): Promise<User | null> {
    const existing = await this.findById(id)
    if (!existing) return null

    const sets: string[] = []
    const values: (string | null)[] = []

    if (input.email !== undefined) { sets.push('email = ?'); values.push(input.email) }
    if (input.name !== undefined) { sets.push('name = ?'); values.push(input.name) }
    if (input.displayName !== undefined) { sets.push('display_name = ?'); values.push(input.displayName) }
    if (input.avatarUrl !== undefined) { sets.push('avatar_url = ?'); values.push(input.avatarUrl) }
    if (input.bio !== undefined) { sets.push('bio = ?'); values.push(input.bio) }

    if (sets.length === 0) return existing

    const updatedAt = new Date().toISOString()
    sets.push('updated_at = ?')
    values.push(updatedAt)
    values.push(id)

    await this.db
      .prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`)
      .bind(...values)
      .run()

    return {
      ...existing,
      email: input.email ?? existing.email,
      name: input.name ?? existing.name,
      displayName: input.displayName ?? existing.displayName,
      avatarUrl: input.avatarUrl ?? existing.avatarUrl,
      bio: input.bio ?? existing.bio,
      updatedAt,
    }
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.prepare('DELETE FROM users WHERE id = ?').bind(id).run()
    return result.meta.changes > 0
  }
}
