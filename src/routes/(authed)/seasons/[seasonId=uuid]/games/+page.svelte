<script lang="ts">
  import * as Table from '$lib/components/ui/table'
  import * as Card from '$lib/components/ui/card'

  let { data } = $props()
</script>

<Card.Root>
  <Card.Header>
    <Card.Title>Games</Card.Title>
  </Card.Header>
  <Card.Content>
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.Head>Game</Table.Head>
          <Table.Head>Dates</Table.Head>
          <Table.Head>Chosen by</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {#each data.games as game (game.game_id)}
          <Table.Row>
            <Table.Cell>{game.game_name}</Table.Cell>
            <Table.Cell>{game.dates}</Table.Cell>
            <Table.Cell>{game.chosen_by ?? '—'}</Table.Cell>
          </Table.Row>
        {:else}
          <Table.Row>
            <Table.Cell colspan={3} class="h-24 text-center">No games played yet.</Table.Cell>
          </Table.Row>
        {/each}
      </Table.Body>
    </Table.Root>
  </Card.Content>
</Card.Root>
