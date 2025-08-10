import { createBrowserClient } from "@supabase/ssr"

// Singleton pattern for client-side Supabase client
let supabase: ReturnType<typeof createBrowserClient> | undefined

export function createClientSideSupabase() {
  if (!supabase) {
    supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  }
  return supabase
}
