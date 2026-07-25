const STORAGE_KEY = 'auth-token'

function getToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  }
  catch {
    return null
  }
}

export function setToken(token: string | null) {
  if (token) {
    localStorage.setItem(STORAGE_KEY, token)
  }
  else {
    localStorage.removeItem(STORAGE_KEY)
  }
}

export function clearToken() {
  localStorage.removeItem(STORAGE_KEY)
}

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | undefined>
}

export async function request<T>(url: string, init?: RequestOptions): Promise<T> {
  const token = getToken()

  const isFormData = init?.body instanceof FormData

  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string> | undefined),
  }

  // Only set Content-Type for non-FormData requests — browser handles FormData boundary
  if (!isFormData) {
    headers['Content-Type'] = 'application/json'
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  // Build URL with query params
  let fullUrl = url
  if (init?.params) {
    const searchParams = new URLSearchParams()
    for (const [key, value] of Object.entries(init.params)) {
      if (value !== undefined && value !== '') {
        searchParams.set(key, String(value))
      }
    }
    const qs = searchParams.toString()
    if (qs) {
      fullUrl += (url.includes('?') ? '&' : '?') + qs
    }
  }

  const { params: _params, ...fetchInit } = init ?? {}

  const res = await fetch(fullUrl, {
    ...fetchInit,
    headers,
  })

  const contentType = res.headers.get('content-type') ?? ''
  const isJson = contentType.includes('application/json')

  if (!res.ok) {
    if (isJson) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err?.error?.message ?? err?.message ?? `HTTP ${res.status}`)
    }
    throw new Error(`HTTP ${res.status} — backend returned non-JSON response. Check VITE_BACKEND_URL.`)
  }

  if (!isJson)
    throw new Error('Backend returned non-JSON response. Check VITE_BACKEND_URL.')

  return res.json()
}
