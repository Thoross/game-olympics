<script lang="ts">
  import SeasonStatusBadge from '$lib/components/SeasonStatusBadge.svelte'
  import * as Table from '$lib/components/ui/table'
  import * as Card from '$lib/components/ui/card'
  import Button from '$lib/components/ui/button/button.svelte'

  let { data } = $props()
</script>

<svelte:head>
  <title>Season Management - Game Olympics</title>
</svelte:head>

<div class="flex items-center justify-between">
  <h1>Season Management</h1>
  <Button href="/admin/seasons/add">Add Season</Button>
</div>

<Card.Root class="mt-6">
  <Card.Header>
    <Card.Title>Seasons</Card.Title>
  </Card.Header>
  <Card.Content>
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.Head>Name</Table.Head>
          <Table.Head>Description</Table.Head>
          <Table.Head>Status</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {#each data.seasons as season (season.season_id)}
          <Table.Row>
            <Table.Cell>
              <a href="/admin/seasons/{season.season_id}" class="font-medium hover:underline">
                {season.season_name}
              </a>
            </Table.Cell>
            <Table.Cell class="text-muted-foreground">{season.season_description ?? '—'}</Table.Cell
            >
            <Table.Cell
              ><SeasonStatusBadge seasonStatus={season.season_status ?? 'UPCOMING'} /></Table.Cell
            >
          </Table.Row>
        {:else}
          <Table.Row>
            <Table.Cell colspan={3} class="h-24 text-center">No seasons found.</Table.Cell>
          </Table.Row>
        {/each}
      </Table.Body>
    </Table.Root>
  </Card.Content>
</Card.Root>
