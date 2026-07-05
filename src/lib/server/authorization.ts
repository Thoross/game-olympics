import { error } from '@sveltejs/kit'

type UserWithRole = { player_role?: 'ADMIN' | 'PLAYER' } | null

export function requireAdmin(user: UserWithRole): void {
  if (!user || user.player_role !== 'ADMIN') {
    error(403, 'Forbidden: admin access required')
  }
}

export function isAdmin(user: UserWithRole): boolean {
  return user?.player_role === 'ADMIN'
}
