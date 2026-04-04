<script lang="ts">
  import { enhance } from '$app/forms'
  import * as Select from '$lib/components/ui/select'
  import Input from '$lib/components/ui/input/input.svelte'
  import Label from '$lib/components/ui/label/label.svelte'
  import Button from '$lib/components/ui/button/button.svelte'

  let { data, form } = $props()

  const statusOptions = [
    { value: 'UPCOMING', label: 'Upcoming' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'SUSPENDED', label: 'Suspended' },
    { value: 'COMPLETED', label: 'Completed' },
  ]

  let seasonStatus = $state<string>(data.season.season_status)
  let selectedPlayerId = $state('')
  let savingDetails = $state(false)
  let addingPlayer = $state(false)

  let selectedStatusLabel = $derived(
    statusOptions.find((s) => s.value === seasonStatus)?.label ?? seasonStatus,
  )
  let selectedPlayerName = $derived(
    data.availablePlayers.find((p) => p.player_id === selectedPlayerId)?.player_name,
  )

  function formatSchedule(multipliers: number[] | null): string {
    if (!multipliers || multipliers.length === 0) return 'No schedule'
    return multipliers.map((m) => `${m}×`).join(' → ')
  }
</script>

<svelte:head>
  <title>{data.season.season_name} — Edit - Game Olympics</title>
</svelte:head>

<div class="mb-2">
  <a href="/admin/seasons" class="text-muted-foreground hover:text-foreground text-sm">
    ← Season Management
  </a>
</div>
<h1>{data.season.season_name}</h1>

<!-- Season Details Form -->
<section class="mt-6 max-w-lg">
  <h2 class="mb-4 text-lg font-semibold">Details</h2>
  <form
    method="POST"
    action="?/updateDetails"
    class="flex flex-col gap-4"
    use:enhance={({ formData }) => {
      formData.set('season_status', seasonStatus)
      savingDetails = true
      return async ({ update }) => {
        savingDetails = false
        update()
      }
    }}
  >
    <div class="flex flex-col gap-1.5">
      <Label for="season_name">Name</Label>
      <Input id="season_name" name="season_name" value={data.season.season_name} required />
    </div>

    <div class="flex flex-col gap-1.5">
      <Label for="season_description">Description</Label>
      <Input
        id="season_description"
        name="season_description"
        value={data.season.season_description ?? ''}
      />
    </div>

    <div class="flex flex-col gap-1.5">
      <Label>Status</Label>
      <Select.Root type="single" bind:value={seasonStatus}>
        <Select.Trigger class="w-full">{selectedStatusLabel}</Select.Trigger>
        <Select.Content>
          {#each statusOptions as opt (opt.value)}
            <Select.Item value={opt.value}>{opt.label}</Select.Item>
          {/each}
        </Select.Content>
      </Select.Root>
    </div>

    {#if form?.updateError}
      <p class="text-destructive text-sm">{form.updateError}</p>
    {/if}
    {#if form?.updateSuccess}
      <p class="text-sm text-green-600">Saved.</p>
    {/if}

    <div>
      <Button type="submit" disabled={savingDetails}>
        {savingDetails ? 'Saving…' : 'Save Details'}
      </Button>
    </div>
  </form>
</section>

<hr class="my-8" />

<!-- Scoring Schedule -->
<section class="max-w-lg">
  <h2 class="mb-2 text-lg font-semibold">Scoring Schedule</h2>
  <p class="text-muted-foreground mb-3 text-sm">
    {formatSchedule(data.schedule?.multipliers ?? null)}
  </p>
  <a
    href="/admin/scoring?season={data.season.season_id}"
    class="text-sm underline underline-offset-4 hover:opacity-80"
  >
    Manage scoring schedule →
  </a>
</section>

<hr class="my-8" />

<!-- Players Section -->
<section class="max-w-lg">
  <h2 class="mb-4 text-lg font-semibold">Players</h2>

  <!-- Current players -->
  {#if data.seasonPlayers.length > 0}
    <ul class="mb-4 divide-y rounded-md border">
      {#each data.seasonPlayers as sp (sp.season_players_id)}
        <li class="flex items-center justify-between px-4 py-2">
          <span>{sp.player?.player_name ?? '—'}</span>
          <form method="POST" action="?/removePlayer" use:enhance>
            <input type="hidden" name="season_players_id" value={sp.season_players_id} />
            <Button type="submit" variant="ghost" size="sm" class="text-muted-foreground hover:text-destructive">
              Remove
            </Button>
          </form>
        </li>
      {/each}
    </ul>
  {:else}
    <p class="text-muted-foreground mb-4 text-sm">No players in this season yet.</p>
  {/if}

  <!-- Add player -->
  {#if data.availablePlayers.length > 0}
    <form
      method="POST"
      action="?/addPlayer"
      class="flex items-center gap-2"
      use:enhance={({ formData }) => {
        formData.set('player_id', selectedPlayerId)
        addingPlayer = true
        return async ({ update }) => {
          addingPlayer = false
          selectedPlayerId = ''
          update()
        }
      }}
    >
      <div class="flex-1">
        <Select.Root
          type="single"
          value={selectedPlayerId}
          onValueChange={(v) => (selectedPlayerId = v)}
        >
          <Select.Trigger class="w-full">
            {selectedPlayerName ?? 'Select player to add…'}
          </Select.Trigger>
          <Select.Content>
            {#each data.availablePlayers as player (player.player_id)}
              <Select.Item value={player.player_id}>{player.player_name}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      </div>
      <Button type="submit" disabled={!selectedPlayerId || addingPlayer}>
        {addingPlayer ? 'Adding…' : 'Add'}
      </Button>
    </form>

    {#if form?.addPlayerError}
      <p class="text-destructive mt-2 text-sm">{form.addPlayerError}</p>
    {/if}
  {:else if data.seasonPlayers.length > 0}
    <p class="text-muted-foreground text-sm">All players are already in this season.</p>
  {/if}
</section>
