import { error } from '@sveltejs/kit'
import { requireAdmin, isAdmin } from '$lib/server/authorization'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ locals, params }) => {
  const { id } = params
  try {
    const { data, error } = await locals.supabase
      .from('player')
      .select('*')
      .eq('player_id', id)
      .limit(1)
      .maybeSingle()
    if (error) {
      {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 })
      }
    }
    if (!data) {
      return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })
    }
    return new Response(JSON.stringify(data), { status: 200 })
  } catch (err: unknown) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
}

export const PUT: RequestHandler = async ({ request, params, locals }) => {
  const { id } = params
  if (locals.user?.player_id !== id && !isAdmin(locals.user)) {
    error(403, 'Forbidden')
  }
  try {
    const body = await request.json()
    const { data, error } = await locals.supabase
      .from('player')
      .update(body)
      .eq('player_id', id)
      .select()
      .maybeSingle()
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }
    if (!data) {
      return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })
    }
    return new Response(JSON.stringify(data), { status: 200 })
  } catch (err: unknown) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
}

export const DELETE: RequestHandler = async ({ params, locals }) => {
  requireAdmin(locals.user)
  const { id } = params
  try {
    const { data, error } = await locals.supabase
      .from('player')
      .delete()
      .eq('player_id', id)
      .select()
      .maybeSingle()
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }
    if (!data) {
      return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })
    }
    return new Response(JSON.stringify({ success: true, data }), { status: 200 })
  } catch (err: unknown) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
}
