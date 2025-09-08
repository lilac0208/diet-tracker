import { createClient } from '@supabase/supabase-js'

const getEnv = () => ({
  url: import.meta.env.VITE_SUPABASE_URL,
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
})

let client = null

export function getSupabase() {
  if (client) return client
  const { url, anonKey } = getEnv()
  if (!url || !anonKey) return null
  client = createClient(url, anonKey)
  return client
}


