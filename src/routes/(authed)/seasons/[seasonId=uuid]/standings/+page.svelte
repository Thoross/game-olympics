<script lang="ts">
  import * as Table from '$lib/components/ui/table'
  import * as Card from '$lib/components/ui/card'

  let { data } = $props()
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
        <Table.Head class="text-right">Avg Score</Table.Head>
        <Table.Head class="text-right">Avg Position</Table.Head>
      </Table.Row>
    </Table.Header>
    <Table.Body>
      {#each data.standings as standing, i}
        <Table.Row>
          <Table.Cell class="font-medium">{i + 1}</Table.Cell>
          <Table.Cell>{standing.player_name}</Table.Cell>
          <Table.Cell class="text-right">{standing.games_played}</Table.Cell>
          <Table.Cell class="text-right">{standing.standings_points}</Table.Cell>
          <Table.Cell class="text-right">{standing.avg_score.toFixed(2)}</Table.Cell>
          <Table.Cell class="text-right">{standing.avg_position.toFixed(2)}</Table.Cell>
        </Table.Row>
      {:else}
        <Table.Row>
          <Table.Cell colspan={6} class="h-24 text-center">No standings yet.</Table.Cell>
        </Table.Row>
      {/each}
    </Table.Body>
  </Table.Root>
  </Card.Content>
</Card.Root>
