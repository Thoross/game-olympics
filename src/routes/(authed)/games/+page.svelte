<script lang="ts">
  import GamesTable from '$lib/components/tables/GamesTable.svelte'
  import Button from '$lib/components/ui/button/button.svelte'
  import FieldLabel from '$lib/components/ui/field/field-label.svelte'
  import Field from '$lib/components/ui/field/field.svelte'
  import Input from '$lib/components/ui/input/input.svelte'

  let { data } = $props()
</script>

<svelte:head>
  <title>Games - Game Olympics</title>
</svelte:head>

<h1>Games</h1>

<div class="mt-4 mb-4">
  <form method="GET" class="flex flex-row gap-6">
    <div class="flex flex-col">
      <Field>
        <FieldLabel for="nameFilter">Name</FieldLabel>
        <Input id="nameFilter" placeholder="Filter by name" name="game-name" />
      </Field>
    </div>

    <Button type="submit" class="cursor-pointer self-end">Apply Filters</Button>
  </form>
</div>

<GamesTable games={data.games} />
