import type { Handle } from '@sveltejs/kit'

export const augmentUser: Handle = async ({ event, resolve }) => {
  const { data, error } = await event.locals.supabase
    .from('player')
    .select('player_id, player_name, player_role')
    .eq('auth_id', event.locals.user?.id ?? '')
    .limit(1)
  if (error) {
    return resolve(event)
  }
  const player = data?.at(0)
  if (event.locals.user) {
    event.locals.user = {
      ...event.locals.user,
      player_id: player?.player_id ?? '',
      player_name: player?.player_name ?? '',
      player_role: player?.player_role === 'ADMIN' ? 'ADMIN' : 'PLAYER',
    }
  }
  return resolve(event)
}
