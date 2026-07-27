<script lang="ts">
  import { enhance } from '$app/forms'
  import { page } from '$app/state'
  import * as Select from '$lib/components/ui/select'
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

  let seasonId = $state(page.url.searchParams.get('season') ?? '')
  let gameId = $state('')
  let datePlayed = $state(todayLocal())
  let playerEntries = $state<PlayerEntry[]>([])
  let loading = $state(false)

  let selectedSeason = $derived(data.seasons.find((s) => s.season_id === seasonId))
  let selectedGame = $derived(data.games.find((g) => g.game_id === gameId))
  let gameFields = $derived(gameId ? (data.fieldsByGame[gameId] ?? []) : [])

  let seasonRoster = $derived(data.playersBySeason[seasonId] ?? [])
  let availableChips = $derived(
    seasonRoster.filter((p) => !playerEntries.some((e) => e.player_id === p.player_id)),
  )
  let deepLinkNotSelectable = $derived(
    seasonId !== '' && !data.seasons.some((s) => s.season_id === seasonId),
  )

  function changeSeason(v: string) {
    seasonId = v
    playerEntries = []
  }

  function addPlayer(p: { player_id: string; player_name: string }) {
    if (playerEntries.some((e) => e.player_id === p.player_id)) return
    playerEntries = [...playerEntries, { player_id: p.player_id, score: '' }]
  }

  function removePlayer(index: number) {
    playerEntries = playerEntries.filter((_, i) => i !== index)
  }

  function playerName(playerId: string) {
    return seasonRoster.find((p) => p.player_id === playerId)?.player_name ?? playerId
  }
</script>

<svelte:head>
  <title>Add Session - Game Olympics</title>
</svelte:head>

<h1>Add Session</h1>

<form
  method="POST"
  class="mt-6 flex max-w-lg flex-col gap-6"
  use:enhance={({ formData }) => {
    formData.set('season_id', seasonId)
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
    return async ({ update }) => {
      loading = false
      update()
    }
  }}
>
  <!-- Season -->
  <div class="flex flex-col gap-1.5">
    <Label>Season</Label>
    <Select.Root type="single" value={seasonId} onValueChange={changeSeason}>
      <Select.Trigger class="w-full">
        {selectedSeason?.season_name ?? 'Select a season…'}
      </Select.Trigger>
      <Select.Content>
        {#each data.seasons as season (season.season_id)}
          <Select.Item value={season.season_id}>{season.season_name}</Select.Item>
        {:else}
          <Select.Item value="" disabled>No active seasons</Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
    {#if deepLinkNotSelectable}
      <p class="text-sm text-muted-foreground">
        This season isn't available for new sessions. Choose an active season above.
      </p>
    {/if}
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

    {#if seasonId === '' || deepLinkNotSelectable}
      <p class="text-sm text-muted-foreground">Select a season to choose players.</p>
    {:else if availableChips.length > 0}
      <div class="flex flex-wrap gap-2">
        {#each availableChips as player (player.player_id)}
          <Button type="button" variant="outline" size="sm" onclick={() => addPlayer(player)}>
            {player.player_name}
          </Button>
        {/each}
      </div>
    {:else if seasonRoster.length === 0}
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

  <div class="flex gap-2">
    <Button type="submit" disabled={loading || playerEntries.length === 0}>
      {loading ? 'Saving…' : 'Save Session'}
    </Button>
    <Button variant="outline" type="button" onclick={() => history.back()}>Cancel</Button>
  </div>
</form>
