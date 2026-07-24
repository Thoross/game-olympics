import { page } from 'vitest/browser'
import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-svelte'
import SeasonStatusBadge from './SeasonStatusBadge.svelte'

describe('SeasonStatusBadge', () => {
  it('renders the human-readable label for a status', async () => {
    render(SeasonStatusBadge, { seasonStatus: 'IN_PROGRESS' })
    await expect.element(page.getByText('In Progress')).toBeInTheDocument()
  })

  it('renders the upcoming label', async () => {
    render(SeasonStatusBadge, { seasonStatus: 'UPCOMING' })
    await expect.element(page.getByText('Upcoming')).toBeInTheDocument()
  })
})
