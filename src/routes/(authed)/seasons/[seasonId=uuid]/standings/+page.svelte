<script lang="ts">
  import * as Table from '$lib/components/ui/table'
  import * as Card from '$lib/components/ui/card'
  import Badge from '$lib/components/ui/badge/badge.svelte'

  let { data } = $props()

  function ordinal(n: number): string {
    const s = ['th', 'st', 'nd', 'rd']
    const v = n % 100
    return n + (s[(v - 20) % 10] ?? s[v] ?? s[0])
  }

  // Pad the newest-first positions out to exactly 4 slots; null slots render as an em dash.
  function lastFour(positions: number[]): (number | null)[] {
    const slots: (number | null)[] = positions.map((p) => (p && p > 0 ? p : null))
    while (slots.length < 4) slots.push(null)
    return slots.slice(0, 4)
  }

  // Parse the 'YYYY-MM-DD' dues date as a local day to avoid a UTC off-by-one.
  function formatDate(date: string): string {
    const [y, m, d] = date.slice(0, 10).split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
</script>

<Card.Root>
  <Card.Header>
    <Card.Title>Standings</Card.Title>
  </Card.Header>
  <Card.Content>
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.Head class="w-12">Rank</Table.Head>
          <Table.Head>Player</Table.Head>
          <Table.Head class="text-right">Games Played</Table.Head>
          <Table.Head class="text-right">Points</Table.Head>
          <Table.Head>Last 4</Table.Head>
          <Table.Head class="text-right">Games Chosen</Table.Head>
          <Table.Head class="text-right">Dues</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {#each data.standings as standing, i (standing.player_id)}
          <Table.Row>
            <Table.Cell class="font-medium">{i + 1}</Table.Cell>
            <Table.Cell>{standing.player_name}</Table.Cell>
            <Table.Cell class="text-right">{standing.games_played}</Table.Cell>
            <Table.Cell class="text-right">{standing.standings_points}</Table.Cell>
            <Table.Cell>
              <div class="flex gap-1">
                {#each lastFour(standing.last_positions) as pos, idx (idx)}
                  <Badge variant="secondary" class="tabular-nums">
                    {pos != null ? ordinal(pos) : '—'}
                  </Badge>
                {/each}
              </div>
            </Table.Cell>
            <Table.Cell class="text-right">{standing.games_chosen}</Table.Cell>
            <Table.Cell class="text-right">
              {standing.date_paid ? formatDate(standing.date_paid) : '—'}
            </Table.Cell>
          </Table.Row>
        {:else}
          <Table.Row>
            <Table.Cell colspan={7} class="h-24 text-center">No standings yet.</Table.Cell>
          </Table.Row>
        {/each}
      </Table.Body>
    </Table.Root>
  </Card.Content>
</Card.Root>
