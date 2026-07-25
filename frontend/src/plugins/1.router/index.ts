import type { App } from 'vue'

import { setupLayouts } from 'virtual:generated-layouts'
import type { RouteRecordRaw } from 'vue-router/auto'

import { createRouter, createWebHistory } from 'vue-router/auto'

function recursiveLayouts(route: RouteRecordRaw): RouteRecordRaw {
  if (route.children) {
    for (let i = 0; i < route.children.length; i++)
      route.children[i] = recursiveLayouts(route.children[i])

    return route
  }

  return setupLayouts([route])[0]
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to) {
    if (to.hash)
      return { el: to.hash, behavior: 'smooth', top: 60 }

    return { top: 0 }
  },
  extendRoutes: pages => [
    ...[...pages].map(route => recursiveLayouts(route)),
  ],
})

/* ── Route Guards ── */

function hasValidToken(): boolean {
  try {
    const token = localStorage.getItem('auth-token')
    if (!token)
      return false

    // Simple JWT expiry check — decode the payload (parts[1])
    const parts = token.split('.')
    if (parts.length !== 3)
      return false

    const payload = JSON.parse(atob(parts[1]))
    return payload.exp * 1000 > Date.now()
  }
  catch {
    return false
  }
}

router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some((record) => {
    const layout = record.meta?.layout as string | undefined
    return layout !== 'blank'
  })

  const unauthenticatedOnly = to.matched.some(record => record.meta?.unauthenticatedOnly === true)
  const authenticated = hasValidToken()

  // Guest-only page (login, register) — redirect to / if already authenticated
  if (unauthenticatedOnly && authenticated) {
    return next('/')
  }

  // Auth-required page — redirect to /login if not authenticated
  if (requiresAuth && !authenticated) {
    return next('/login')
  }

  next()
})

export { router }

export default function (app: App) {
  app.use(router)
}
