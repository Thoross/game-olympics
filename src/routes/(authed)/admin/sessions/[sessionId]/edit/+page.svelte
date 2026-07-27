<script lang="ts">
  import { enhance } from '$app/forms'
  import { goto } from '$app/navigation'
  import * as Select from '$lib/components/ui/select'
  import * as Dialog from '$lib/components/ui/dialog'
  import Input from '$lib/components/ui/input/input.svelte'
  import Label from '$lib/components/ui/label/label.svelte'
  import Button from '$lib/components/ui/button/button.svelte'

  let { data, form } = $props()

  type PlayerEntry = { player_id: string; score: string }

  function todayLocal() {
    const d = new Date()
    const off = d.getTimezoneOffset()
    return new Date(d.getTime() - off * 60_000).toISOString().split('T')[0]
  }

  let gameId = $state(data.session.game_id)
  let datePlayed = $state(data.session.session_date_played?.slice(0, 10) ?? '')
  let playerEntries = $state<PlayerEntry[]>(
    data.session.players.map((p) => ({ player_id: p.player_id, score: String(p.score) })),
  )
  let loading = $state(false)

  let selectedGame = $derived(data.games.find((g) => g.game_id === gameId))
  let gameFields = $derived(gameId ? (data.fieldsByGame[gameId] ?? []) : [])

  let availableChips = $derived(
    data.roster.filter((p) => !playerEntries.some((e) => e.player_id === p.player_id)),
  )

  // Existing per-player metadata values, keyed by player_id then field_id, for prefill.
  const existingMetadata: Record<string, Record<string, string>> = Object.fromEntries(
    data.session.players.map((p) => [p.player_id, p.metadata ?? {}]),
  )

  function addPlayer(p: { player_id: string; player_name: string }) {
    if (playerEntries.some((e) => e.player_id === p.player_id)) return
    playerEntries = [...playerEntries, { player_id: p.player_id, score: '' }]
  }

  function removePlayer(index: number) {
    playerEntries = playerEntries.filter((_, i) => i !== index)
  }

  function playerName(playerId: string) {
    return data.roster.find((p) => p.player_id === playerId)?.player_name ?? playerId
  }
</script>

<svelte:head>
  <title>Edit Session - Game Olympics</title>
</svelte:head>

<h1>Edit Session</h1>

<form
  method="POST"
  action="?/updateSession"
  class="mt-6 flex max-w-lg flex-col gap-6"
  use:enhance={({ formData }) => {
    formData.set('game_id', gameId)
    formData.set('date_played', datePlayed)
    formData.set('player_count', playerEntries.length.toString())
    playerEntries.forEach((entry, i) => {
      formData.set(`player_id_${i}`, entry.player_id)
      formData.set(`score_${i}`, entry.score)
      gameFields.forEach((f) => {
        const el = document.getElementById(`meta_${i}_${f.field_id}`) as HTMLInputElement | null
        formData.set(`meta_${i}_${f.field_id}`, el?.value ?? '')
      })
    })
    loading = true
    return async ({ result, update }) => {
      loading = false
      if (result.type === 'redirect') {
        // result.location is an already-resolved redirect URL from the server action.
        // eslint-disable-next-line svelte/no-navigation-without-resolve
        await goto(result.location)
      } else {
        await update()
      }
    }
  }}
>
  <!-- Season (fixed) -->
  <div class="flex flex-col gap-1.5">
    <Label>Season</Label>
    <p class="text-sm">{data.session.season_name}</p>
  </div>

  <!-- Date Played -->
  <div class="flex flex-col gap-1.5">
    <Label for="datePlayed">Date Played</Label>
    <Input id="datePlayed" type="date" bind:value={datePlayed} max={todayLocal()} />
  </div>

  <!-- Game -->
  <div class="flex flex-col gap-1.5">
    <Label>Game</Label>
    <Select.Root type="single" bind:value={gameId}>
      <Select.Trigger class="w-full">
        {selectedGame?.game_name ?? 'Select a game…'}
      </Select.Trigger>
      <Select.Content>
        {#each data.games as game (game.game_id)}
          <Select.Item value={game.game_id}>{game.game_name}</Select.Item>
        {:else}
          <Select.Item value="" disabled>No games available</Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
  </div>

  <!-- Players -->
  <div class="flex flex-col gap-3">
    <Label>Players</Label>

    {#if availableChips.length > 0}
      <div class="flex flex-wrap gap-2">
        {#each availableChips as player (player.player_id)}
          <Button type="button" variant="outline" size="sm" onclick={() => addPlayer(player)}>
            {player.player_name}
          </Button>
        {/each}
      </div>
    {:else if data.roster.length === 0}
      <p class="text-sm text-muted-foreground">No players in this season.</p>
    {:else}
      <p class="text-sm text-muted-foreground">All players added.</p>
    {/if}

    {#each playerEntries as entry, i (entry.player_id)}
      <div class="flex items-center gap-2">
        <div class="flex-1">{playerName(entry.player_id)}</div>

        <div class="w-28">
          <Input
            type="number"
            placeholder="Score"
            value={entry.score}
            oninput={(e) => {
              playerEntries[i] = { ...playerEntries[i], score: e.currentTarget.value }
            }}
          />
        </div>

        {#each gameFields as f (f.field_id)}
          <div class="w-40">
            <Input
              id="meta_{i}_{f.field_id}"
              list="datalist_{f.field_id}"
              placeholder={f.field_name}
              value={existingMetadata[entry.player_id]?.[f.field_id] ?? ''}
            />
            <datalist id="datalist_{f.field_id}">
              {#each data.valuesByField[f.field_id] ?? [] as v (v)}
                <option value={v}></option>
              {/each}
            </datalist>
          </div>
        {/each}

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onclick={() => removePlayer(i)}
          class="shrink-0 text-muted-foreground hover:text-destructive"
        >
          Remove
        </Button>
      </div>
    {/each}
  </div>

  {#if form?.message}
    <p class="text-sm text-destructive">{form.message}</p>
  {/if}

  <div class="flex flex-wrap gap-2">
    <Button type="submit" disabled={loading || playerEntries.length === 0}>
      {loading ? 'Saving…' : 'Save Changes'}
    </Button>
    <Button variant="outline" type="button" onclick={() => history.back()}>Cancel</Button>

    <Dialog.Root>
      <Dialog.Trigger>
        {#snippet child({ props })}
          <Button {...props} variant="destructive" class="ml-auto">Delete Session</Button>
        {/snippet}
      </Dialog.Trigger>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Delete this session?</Dialog.Title>
          <Dialog.Description>
            This permanently removes the session and its player scores. This can't be undone.
          </Dialog.Description>
        </Dialog.Header>
        <Dialog.Footer>
          <Dialog.Close>
            {#snippet child({ props })}
              <Button {...props} variant="outline">Cancel</Button>
            {/snippet}
          </Dialog.Close>
          <form method="POST" action="?/deleteSession" use:enhance>
            <input type="hidden" name="season_id" value={data.session.season_id} />
            <Button type="submit" variant="destructive">Delete</Button>
          </form>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>
  </div>
</form>
