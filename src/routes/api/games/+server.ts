import { requireAdmin } from '$lib/server/authorization'

export const PUT = async ({ request, locals }) => {
  requireAdmin(locals.user)
  try {
    const body = await request.json()
    const payload = Array.isArray(body) ? body : [body]
    const { data, error } = await locals.supabase.from('games').upsert(payload).select()
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }
    return new Response(JSON.stringify(data), { status: 201 })
  } catch (err: unknown) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
}

export const POST = async ({ request, locals }) => {
  const { supabase } = locals
  try {
    const body = await request.json()
    let query = supabase.from('games').select('*')

    if ('name' in body) {
      query = query.ilike('game_name', `%${body.name}%`)
    }

    const { data, error } = await query

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }
    return new Response(JSON.stringify(data), { status: 201 })
  } catch (err: unknown) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
}
