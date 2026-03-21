export const GET = async ({ locals }) => {
  try {
    const { data, error } = await locals.supabase.from('player').select('*')
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }
    return new Response(JSON.stringify(data), { status: 200 })
  } catch (err: unknown) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
}

import { requireAdmin } from '$lib/server/authorization'

export const POST = async ({ request, locals }) => {
  requireAdmin(locals.user)
  try {
    const body = await request.json()
    const payload = Array.isArray(body) ? body : [body]
    const { data, error } = await locals.supabase.from('player').insert(payload).select()
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }
    return new Response(JSON.stringify(data), { status: 201 })
  } catch (err: unknown) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
}
