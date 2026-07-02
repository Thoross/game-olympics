import { redirect, type RequestHandler } from '@sveltejs/kit'
import type { EmailOtpType } from '@supabase/supabase-js'

export const GET: RequestHandler = async ({ url, locals: { supabase } }) => {
  const token_hash = url.searchParams.get('token_hash')
  const type = url.searchParams.get('type') as EmailOtpType | null
  const code = url.searchParams.get('code')
  const next = url.searchParams.get('next') ?? '/'

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type })
    if (!error) {
      redirect(303, next)
    }
    console.error('verifyOtp failed', error)
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      redirect(303, next)
    }
    console.error('exchangeCodeForSession failed', error)
  }

  redirect(303, '/auth/signin?error=invalid_link')
}
