<script lang="ts">
  import { enhance } from '$app/forms'
  import * as Select from '$lib/components/ui/select'
  import Input from '$lib/components/ui/input/input.svelte'
  import Label from '$lib/components/ui/label/label.svelte'
  import Button from '$lib/components/ui/button/button.svelte'

  let { data, form } = $props()

  type PlayerEntry = { player_id: string; score: string }

  let seasonId = $state('')
  let gameId = $state('')
  let datePlayed = $state('')
  let playerEntries = $state<PlayerEntry[]>([{ player_id: '', score: '' }])
  let loading = $state(false)

  let selectedSeason = $derived(data.seasons.find((s) => s.season_id === seasonId))
  let selectedGame = $derived(data.games.find((g) => g.game_id === gameId))

  function addPlayer() {
    playerEntries = [...playerEntries, { player_id: '', score: '' }]
  }

  function removePlayer(index: number) {
    playerEntries = playerEntries.filter((_, i) => i !== index)
  }

  function getSelectedPlayerName(playerId: string) {
    return data.players.find((p) => p.player_id === playerId)?.player_name
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
    <Select.Root type="single" bind:value={seasonId}>
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
  </div>

  <!-- Date Played -->
  <div class="flex flex-col gap-1.5">
    <Label for="datePlayed">Date Played</Label>
    <Input
      id="datePlayed"
      type="date"
      bind:value={datePlayed}
      max={new Date().toISOString().split('T')[0]}
    />
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

    {#each playerEntries as entry, i}
      <div class="flex items-center gap-2">
        <div class="flex-1">
          <Select.Root
            type="single"
            value={entry.player_id}
            onValueChange={(v) => {
              playerEntries[i] = { ...playerEntries[i], player_id: v }
            }}
          >
            <Select.Trigger class="w-full">
              {getSelectedPlayerName(entry.player_id) ?? 'Select player…'}
            </Select.Trigger>
            <Select.Content>
              {#each data.players as player (player.player_id)}
                <Select.Item value={player.player_id}>{player.player_name}</Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
        </div>

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

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onclick={() => removePlayer(i)}
          disabled={playerEntries.length === 1}
          class="text-muted-foreground hover:text-destructive shrink-0"
        >
          Remove
        </Button>
      </div>
    {/each}

    <Button type="button" variant="outline" size="sm" onclick={addPlayer} class="w-fit">
      + Add Player
    </Button>
  </div>

  {#if form?.message}
    <p class="text-destructive text-sm">{form.message}</p>
  {/if}

  <div class="flex gap-2">
    <Button type="submit" disabled={loading}>
      {loading ? 'Saving…' : 'Save Session'}
    </Button>
    <Button variant="outline" type="button" onclick={() => history.back()}>Cancel</Button>
  </div>
</form>
