import { redirect, type Handle } from '@sveltejs/kit'

export const hasAuthSession: Handle = async ({ event, resolve }) => {
  const isAuthRoute =
    event.route.id === '/auth/signin' ||
    event.route.id === '/auth/register' ||
    event.route.id === '/auth/forgot-password' ||
    event.route.id === '/auth/reset-password'
  const { session: hasSession, user } = await event.locals.safeGetSession()

  if (isAuthRoute && !hasSession) {
    return resolve(event)
  }
  if (!hasSession) {
    redirect(303, '/auth/signin')
  }
  if (isAuthRoute && hasSession && event.route.id !== '/auth/reset-password') {
    redirect(303, '/')
  }
  event.locals.user = user
  event.locals.session = hasSession
  return resolve(event)
}
