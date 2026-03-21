import { sequence } from '@sveltejs/kit/hooks'
import { supabase } from '$lib/hooks/supabase'
import { hasAuthSession } from '$lib/hooks/hasAuthSession'
import { augmentUser } from '$lib/hooks/augmentUser'

export const handle = sequence(supabase, hasAuthSession, augmentUser)
