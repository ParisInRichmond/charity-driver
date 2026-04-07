// Supabase Configuration — Charity Driver
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const SUPABASE_URL = 'https://hnhmwfkdqrlxgxwozsbx.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_O0hRM5phMmphI7RKSOTYKA_nKCg4uM3'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Helper: get current session user
export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Helper: redirect to login if not authenticated
export async function requireAuth() {
  const user = await getUser()
  if (!user) window.location.href = 'login.html'
  return user
}

// Helper: redirect to dashboard if already logged in
export async function redirectIfLoggedIn() {
  const user = await getUser()
  if (user) window.location.href = 'dashboard.html'
}
