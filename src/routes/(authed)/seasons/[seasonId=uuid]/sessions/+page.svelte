<script lang="ts">
  import * as Table from '$lib/components/ui/table'
  import * as Card from '$lib/components/ui/card'

  let { data } = $props()

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  function getGameName(session: (typeof data.sessions)[number]) {
    const g = Array.isArray(session.games) ? session.games[0] : session.games
    return g?.game_name ?? '—'
  }

  function getPlayers(session: (typeof data.sessions)[number]) {
    return (session.player_sessions ?? [])
      .slice()
      .sort((a, b) => (a.player_session_position ?? 0) - (b.player_session_position ?? 0))
      .map((ps) => {
        const p = Array.isArray(ps.player) ? ps.player[0] : ps.player
        return `${p?.player_name ?? '?'}`
      })
      .join(', ')
  }
</script>

<Card.Root>
  <Card.Header>
    <Card.Title>Sessions</Card.Title>
  </Card.Header>
  <Card.Content>
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.Head>Date</Table.Head>
          <Table.Head>Game</Table.Head>
          <Table.Head>Players &amp; Scores</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {#each data.sessions as session}
          <Table.Row>
            <Table.Cell class="whitespace-nowrap">{formatDate(session.created_at)}</Table.Cell>
            <Table.Cell>{getGameName(session)}</Table.Cell>
            <Table.Cell>{getPlayers(session)}</Table.Cell>
          </Table.Row>
        {:else}
          <Table.Row>
            <Table.Cell colspan={3} class="h-24 text-center">No sessions yet.</Table.Cell>
          </Table.Row>
        {/each}
      </Table.Body>
    </Table.Root>
  </Card.Content>
</Card.Root>
