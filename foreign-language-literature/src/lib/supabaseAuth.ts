export type AuthUser = {
  id: string
  email: string
}

type AuthResponse = {
  access_token: string
  refresh_token: string
  user: {
    id: string
    email?: string
  }
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

const authBase = SUPABASE_URL ? `${SUPABASE_URL.replace(/\/$/, '')}/auth/v1` : ''

function ensureConfig() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY が未設定です')
  }
}

async function request(path: string, init: RequestInit = {}) {
  ensureConfig()
  const res = await fetch(`${authBase}${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_ANON_KEY!,
      'Content-Type': 'application/json',
      ...(init.headers || {})
    }
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Auth request failed: ${res.status}`)
  }
  return res
}

export async function signInWithPassword(email: string, password: string) {
  const res = await request('/token?grant_type=password', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  })
  const data = (await res.json()) as AuthResponse
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    user: {
      id: data.user.id,
      email: data.user.email || email
    } satisfies AuthUser
  }
}

export async function signUpWithPassword(email: string, password: string) {
  const res = await request('/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  })
  const data = (await res.json()) as Partial<AuthResponse>
  return {
    accessToken: data.access_token || '',
    refreshToken: data.refresh_token || '',
    user: {
      id: data.user?.id || '',
      email: data.user?.email || email
    } satisfies AuthUser
  }
}

export async function getUserByAccessToken(accessToken: string) {
  const res = await request('/user', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })
  const data = (await res.json()) as { id: string; email?: string }
  return {
    id: data.id,
    email: data.email || ''
  } satisfies AuthUser
}

export async function signOut(accessToken: string) {
  await request('/logout', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })
}

export function hasSupabaseConfig() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)
}
