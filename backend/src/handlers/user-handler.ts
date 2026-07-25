import type { Context } from 'hono'
import type { CreateUserInput, UpdateUserInput, User } from '../domain/entities/user'
import { ValidationError } from '../domain/errors'
import type { UserService } from '../services/user-service'

export class UserHandler {
  constructor(private readonly userService: UserService) {}

  list = async (c: Context) => {
    const users = await this.userService.listUsers()
    return c.json({ data: users.map(stripPassword) })
  }

  get = async (c: Context) => {
    const user = await this.userService.getUser(this.param(c, 'id'))
    return c.json({ data: stripPassword(user) })
  }

  update = async (c: Context) => {
    const body = await this.parseJson<UpdateUserInput>(c)
    const user = await this.userService.updateUser(this.param(c, 'id'), body)
    return c.json({ data: stripPassword(user) })
  }

  delete = async (c: Context) => {
    await this.userService.deleteUser(this.param(c, 'id'))
    return c.body(null, 204)
  }

  private param(c: Context, name: string): string {
    const value = c.req.param(name)
    if (!value) throw new ValidationError(`${name} param is required`)
    return value
  }

  private async parseJson<T>(c: Context): Promise<T> {
    try {
      return await c.req.json<T>()
    } catch {
      throw new ValidationError('Invalid JSON body')
    }
  }
}

function stripPassword(user: User) {
  const { passwordHash, ...rest } = user
  return rest
}
