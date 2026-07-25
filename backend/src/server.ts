// Cloudflare Workers entrypoint (referenced by wrangler.jsonc "main").
// Wires D1 + KV implementations into the runtime-agnostic app.
import { createApp } from './app'
import { createContainer } from './di/container'
import { D1MediaRepository } from './infrastructure/d1/d1-media-repository'
import { D1PromptRepository } from './infrastructure/d1/d1-prompt-repository'
import { D1UserRepository } from './infrastructure/d1/d1-user-repository'
import { KVCacheRepository } from './infrastructure/kv/kv-cache-repository'
import { R2MediaStorage } from './infrastructure/r2/r2-media-storage'
import type { Bindings } from './types'

const app = createApp((env) => {
  const bindings = env as Bindings
  const mediaRepository = new D1MediaRepository(bindings.DB)
  const promptRepository = new D1PromptRepository(bindings.DB, mediaRepository)
  return createContainer({
    userRepository: new D1UserRepository(bindings.DB),
    cacheRepository: new KVCacheRepository(bindings.KV),
    promptRepository,
    mediaRepository,
    mediaStorage: new R2MediaStorage(bindings.MEDIA_BUCKET),
  })
})

export default app
