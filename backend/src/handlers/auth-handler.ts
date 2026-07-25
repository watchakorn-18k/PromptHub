import type { Context } from 'hono'
import type { CreateUserInput, LoginInput, UpdateUserInput } from '../domain/entities/user'
import { ValidationError } from '../domain/errors'
import type { AuthService } from '../services/auth-service'

export class AuthHandler {
  constructor(private readonly authService: AuthService) {}

  register = async (c: Context) => {
    const body = await this.parseJson<CreateUserInput>(c)
    const result = await this.authService.register(body)
    return c.json(result, 201)
  }

  login = async (c: Context) => {
    const body = await this.parseJson<LoginInput>(c)
    const result = await this.authService.login(body)
    return c.json(result)
  }

  me = async (c: Context) => {
    const userId = c.get('user').sub
    const user = await this.authService.getProfile(userId)
    // Return public profile without passwordHash
    const { passwordHash, ...publicUser } = user
    return c.json({ data: publicUser })
  }

  updateProfile = async (c: Context) => {
    const userId = c.get('user').sub
    const body = await this.parseJson<UpdateUserInput>(c)
    const user = await this.authService.updateProfile(userId, body)
    return c.json({ data: user })
  }

  private async parseJson<T>(c: Context): Promise<T> {
    try {
      return await c.req.json<T>()
    } catch {
      throw new ValidationError('Invalid JSON body')
    }
  }
}
