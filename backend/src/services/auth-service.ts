import bcrypt from 'bcryptjs'
import { SignJWT } from 'jose'
import type {
  AuthResponse,
  AuthTokens,
  CreateUserInput,
  LoginInput,
  UpdateUserInput,
  User,
  UserPublic,
} from '../domain/entities/user'
import { ConflictError, NotFoundError, UnauthorizedError, ValidationError } from '../domain/errors'
import type { CacheRepository } from '../domain/repositories/cache-repository'
import type { UserRepository } from '../domain/repositories/user-repository'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'prompthub-jwt-secret-change-in-production'
)
const ACCESS_TOKEN_EXPIRES = '1h'
const REFRESH_TOKEN_EXPIRES = '7d'
const CACHE_TTL_SECONDS = 300
const cacheKey = (id: string) => `user:${id}`

export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly cache: CacheRepository
  ) {}

  async register(input: CreateUserInput): Promise<AuthResponse> {
    this.validateEmail(input.email)
    if (!input.name?.trim()) throw new ValidationError('name is required')
    if (!input.password || input.password.length < 6) {
      throw new ValidationError('password must be at least 6 characters')
    }

    const existing = await this.userRepository.findByEmail(input.email)
    if (existing) throw new ConflictError('Email is already registered')

    const passwordHash = await bcrypt.hash(input.password, 10)
    const user = await this.userRepository.create({
      email: input.email,
      name: input.name.trim(),
      displayName: input.displayName || input.name.trim(),
      role: input.role || 'buyer',
      passwordHash,
    })

    const tokens = await this.generateTokens(user)
    return { user: toPublic(user), ...tokens }
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    this.validateEmail(input.email)
    if (!input.password) throw new ValidationError('password is required')

    const user = await this.userRepository.findByEmail(input.email)
    if (!user) throw new UnauthorizedError('Invalid email or password')

    const valid = await bcrypt.compare(input.password, user.passwordHash)
    if (!valid) throw new UnauthorizedError('Invalid email or password')

    const tokens = await this.generateTokens(user)
    return { user: toPublic(user), ...tokens }
  }

  async getProfile(userId: string): Promise<User> {
    const cached = await this.cache.get<User>(cacheKey(userId))
    if (cached) return cached

    const user = await this.userRepository.findById(userId)
    if (!user) throw new NotFoundError('User')

    await this.cache.set(cacheKey(userId), user, CACHE_TTL_SECONDS)
    return user
  }

  async updateProfile(userId: string, input: UpdateUserInput): Promise<UserPublic> {
    if (input.email !== undefined) this.validateEmail(input.email)

    const updated = await this.userRepository.update(userId, input)
    if (!updated) throw new NotFoundError('User')

    await this.cache.delete(cacheKey(userId))
    return toPublic(updated)
  }

  private async generateTokens(user: User): Promise<AuthTokens> {
    const payload = { sub: user.id, role: user.role }

    const accessToken = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(ACCESS_TOKEN_EXPIRES)
      .sign(JWT_SECRET)

    const refreshToken = await new SignJWT({ ...payload, type: 'refresh' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(REFRESH_TOKEN_EXPIRES)
      .sign(JWT_SECRET)

    return { accessToken, refreshToken }
  }

  private validateEmail(email: string): void {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new ValidationError('email is invalid')
    }
  }
}

function toPublic(user: User): UserPublic {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    role: user.role,
    createdAt: user.createdAt,
  }
}
