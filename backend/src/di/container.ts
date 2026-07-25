import type { CacheRepository } from '../domain/repositories/cache-repository'
import type { MediaRepository } from '../domain/repositories/media-repository'
import type { PromptRepository } from '../domain/repositories/prompt-repository'
import type { UserRepository } from '../domain/repositories/user-repository'
import { R2MediaStorage } from '../infrastructure/r2/r2-media-storage'
import { AuthHandler } from '../handlers/auth-handler'
import { MediaHandler } from '../handlers/media-handler'
import { PromptHandler } from '../handlers/prompt-handler'
import { UserHandler } from '../handlers/user-handler'
import { AuthService } from '../services/auth-service'
import { MediaService } from '../services/media-service'
import { PromptService } from '../services/prompt-service'
import { UserService } from '../services/user-service'

export interface Repositories {
  userRepository: UserRepository
  cacheRepository: CacheRepository
  promptRepository: PromptRepository
  mediaRepository: MediaRepository
  mediaStorage: R2MediaStorage
}

export interface Container {
  userHandler: UserHandler
  authHandler: AuthHandler
  promptHandler: PromptHandler
  mediaHandler: MediaHandler
}

export function createContainer(repos: Repositories): Container {
  const userService = new UserService(repos.userRepository, repos.cacheRepository)
  const authService = new AuthService(repos.userRepository, repos.cacheRepository)
  const promptService = new PromptService(repos.promptRepository, repos.mediaRepository, repos.userRepository)
  const mediaService = new MediaService(repos.mediaRepository, repos.mediaStorage)
  return {
    userHandler: new UserHandler(userService),
    authHandler: new AuthHandler(authService),
    promptHandler: new PromptHandler(promptService),
    mediaHandler: new MediaHandler(mediaService),
  }
}
