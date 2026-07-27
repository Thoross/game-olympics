<script lang="ts">
  import { resolve } from '$app/paths'
  import * as Table from '$lib/components/ui/table'
  import * as Card from '$lib/components/ui/card'
  import Button from '$lib/components/ui/button/button.svelte'

  let { data } = $props()

  let isAdmin = $derived(data.user?.player_role === 'ADMIN')
  let columnCount = $derived(isAdmin ? 4 : 3)

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  function getGame(session: (typeof data.sessions)[number]) {
    return Array.isArray(session.games) ? session.games[0] : session.games
  }

  function getPlayers(session: (typeof data.sessions)[number]) {
    return (session.player_sessions ?? [])
      .slice()
      .sort((a, b) => (a.player_session_position ?? 0) - (b.player_session_position ?? 0))
      .map((ps) => {
        const p = Array.isArray(ps.player) ? ps.player[0] : ps.player
        const meta = (ps.player_session_metadata ?? [])
          .map((m) => m.value)
          .filter((v) => v)
          .join(', ')
        const name = p?.player_name ?? '?'
        return meta ? `${name} (${meta})` : name
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
          {#if isAdmin}
            <Table.Head class="text-right">Actions</Table.Head>
          {/if}
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {#each data.sessions as session (session.session_id)}
          <Table.Row>
            <Table.Cell class="whitespace-nowrap"
              >{formatDate(session.session_date_played)}</Table.Cell
            >
            <Table.Cell>
              {@const game = getGame(session)}
              {#if game?.game_id}
                <a href={resolve(`/games/${game.game_id}`)} class="hover:underline"
                  >{game.game_name}</a
                >
              {:else}
                —
              {/if}
            </Table.Cell>
            <Table.Cell>{getPlayers(session)}</Table.Cell>
            {#if isAdmin}
              <Table.Cell class="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  href="/admin/sessions/{session.session_id}/edit"
                >
                  Edit
                </Button>
              </Table.Cell>
            {/if}
          </Table.Row>
        {:else}
          <Table.Row>
            <Table.Cell colspan={columnCount} class="h-24 text-center">No sessions yet.</Table.Cell>
          </Table.Row>
        {/each}
      </Table.Body>
    </Table.Root>
  </Card.Content>
</Card.Root>
