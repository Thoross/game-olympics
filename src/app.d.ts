import { Database } from '$lib/database.types'
import type { Session, SupabaseClient, User } from '@supabase/supabase-js'
// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      supabase: SupabaseClient<Database>
      safeGetSession: () => Promise<{ session: Session | null; user: User | null }>
      session: Session | null
      user: (User & { player_id?: string; player_name?: string; player_role?: 'ADMIN' | 'PLAYER' }) | null
    }
    interface PageData {
      session: Session | null
    }
    // interface PageState {}
    // interface Platform {}
  }
}

export {}
