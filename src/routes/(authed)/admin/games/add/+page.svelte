<script lang="ts">
  import { enhance } from '$app/forms'
  import Button from '$lib/components/ui/button/button.svelte'
  import Input from '$lib/components/ui/input/input.svelte'
  import Label from '$lib/components/ui/label/label.svelte'

  let { form } = $props()

  let loading = $state(false)
</script>

<svelte:head>
  <title>Add Game - Game Olympics</title>
</svelte:head>

<h1>Add Game</h1>

<form
  method="POST"
  class="mt-6 flex max-w-sm flex-col gap-4"
  use:enhance={() => {
    loading = true
    return async ({ update }) => {
      loading = false
      update()
    }
  }}
>
  <div class="flex flex-col gap-1.5">
    <Label for="gameName">Game Name</Label>
    <Input id="gameName" name="gameName" type="text" placeholder="Catan" required />
    {#if form?.errors?.gameName}
      <p class="text-sm text-destructive">{form.errors.gameName}</p>
    {/if}
  </div>

  <div class="flex flex-col gap-1.5">
    <Label for="gameBggUrl"
      >BoardGameGeek URL <span class="text-muted-foreground">(optional)</span></Label
    >
    <Input
      id="gameBggUrl"
      name="gameBggUrl"
      type="url"
      placeholder="https://boardgamegeek.com/boardgame/..."
    />
    {#if form?.errors?.gameBggUrl}
      <p class="text-sm text-destructive">{form.errors.gameBggUrl}</p>
    {/if}
  </div>

  {#if form?.message}
    <p class="text-sm text-destructive">{form.message}</p>
  {/if}

  <div class="flex gap-2">
    <Button type="submit" disabled={loading}>
      {loading ? 'Adding…' : 'Add Game'}
    </Button>
    <Button variant="outline" href="/games">Cancel</Button>
  </div>
</form>
