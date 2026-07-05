<script lang="ts">
  import { enhance } from '$app/forms'
  import { resolve } from '$app/paths'
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

  function todayLocal() {
    const d = new Date()
    const off = d.getTimezoneOffset()
    return new Date(d.getTime() - off * 60_000).toISOString().split('T')[0]
  }

  // Parse the 'YYYY-MM-DD' dues date as a local day to avoid a UTC off-by-one.
  function formatDatePaid(date: string): string {
    const [y, m, d] = date.slice(0, 10).split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }
</script>

<svelte:head>
  <title>{data.season.season_name} — Edit - Game Olympics</title>
</svelte:head>

<div class="mb-2">
  <a href={resolve('/admin/seasons')} class="text-sm text-muted-foreground hover:text-foreground">
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
      <p class="text-sm text-destructive">{form.updateError}</p>
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
  <p class="mb-3 text-sm text-muted-foreground">
    {formatSchedule(data.schedule?.multipliers ?? null)}
  </p>
  <a
    href={resolve(`/admin/scoring?season=${data.season.season_id}`)}
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
        <li class="flex items-center justify-between gap-4 px-4 py-2">
          <span>{sp.player?.player_name ?? '—'}</span>
          <div class="flex items-center gap-4">
            <!-- Dues: ticking stamps today's date, unticking clears to null (unpaid) -->
            <form method="POST" action="?/setDuesPaid" use:enhance>
              <input type="hidden" name="season_players_id" value={sp.season_players_id} />
              <input
                type="hidden"
                name="date_paid"
                value={sp.date_paid != null ? '' : todayLocal()}
              />
              <label class="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={sp.date_paid != null}
                  onchange={(e) => e.currentTarget.form?.requestSubmit()}
                />
                Dues paid{sp.date_paid ? ` (${formatDatePaid(sp.date_paid)})` : ''}
              </label>
            </form>
            <form method="POST" action="?/removePlayer" use:enhance>
              <input type="hidden" name="season_players_id" value={sp.season_players_id} />
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                class="text-muted-foreground hover:text-destructive"
              >
                Remove
              </Button>
            </form>
          </div>
        </li>
      {/each}
    </ul>
    {#if form?.duesError}
      <p class="mb-4 text-sm text-destructive">{form.duesError}</p>
    {/if}
  {:else}
    <p class="mb-4 text-sm text-muted-foreground">No players in this season yet.</p>
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
      <p class="mt-2 text-sm text-destructive">{form.addPlayerError}</p>
    {/if}
  {:else if data.seasonPlayers.length > 0}
    <p class="text-sm text-muted-foreground">All players are already in this season.</p>
  {/if}
</section>

<hr class="my-8" />

<!-- Games Section: who chose each game played in this season -->
<section class="max-w-lg">
  <h2 class="mb-4 text-lg font-semibold">Games</h2>

  {#if data.seasonGames.length > 0}
    <ul class="mb-4 divide-y rounded-md border">
      {#each data.seasonGames as g (g.game_id)}
        <li class="flex items-center justify-between gap-4 px-4 py-2">
          <span>{g.game_name}</span>
          <form method="POST" action="?/setGameChooser" use:enhance>
            <input type="hidden" name="game_id" value={g.game_id} />
            <label class="flex items-center gap-2 text-sm">
              Chosen by
              <select
                name="chosen_by"
                value={g.chosen_by ?? ''}
                onchange={(e) => e.currentTarget.form?.requestSubmit()}
                class="rounded-md border bg-transparent px-2 py-1 text-sm"
              >
                <option value="">— none —</option>
                {#each data.seasonPlayers as sp (sp.season_players_id)}
                  {#if sp.player}
                    <option value={sp.player.player_id}>{sp.player.player_name}</option>
                  {/if}
                {/each}
              </select>
            </label>
          </form>
        </li>
      {/each}
    </ul>
    {#if form?.gameChooserError}
      <p class="mb-4 text-sm text-destructive">{form.gameChooserError}</p>
    {/if}
  {:else}
    <p class="mb-4 text-sm text-muted-foreground">No games have been played in this season yet.</p>
  {/if}
</section>
