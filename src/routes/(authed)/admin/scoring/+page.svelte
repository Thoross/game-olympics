<script lang="ts">
  import { enhance } from '$app/forms'
  import * as Card from '$lib/components/ui/card'
  import Input from '$lib/components/ui/input/input.svelte'
  import Button from '$lib/components/ui/button/button.svelte'
  import SeasonStatusBadge from '$lib/components/SeasonStatusBadge.svelte'

  let { data, form } = $props()

  let expanded = $state<Record<string, boolean>>({})
  let steps = $state<Record<string, number[]>>({})
  let saving = $state<Record<string, boolean>>({})

  $effect(() => {
    data.seasons.forEach((s: { season_id: string; multipliers: number[] | null }) => {
      if (!(s.season_id in steps)) {
        steps[s.season_id] = s.multipliers ? [...s.multipliers] : [1]
      }
    })
    if (data.focusSeasonId) {
      expanded[data.focusSeasonId] = true
    }
  })

  function formatSchedule(multipliers: number[] | null): string {
    if (!multipliers || multipliers.length === 0) return 'No schedule'
    return multipliers.map((m) => `${m}×`).join(' → ')
  }

  function addStep(seasonId: string) {
    steps[seasonId] = [...(steps[seasonId] ?? [1]), 1]
  }

  function removeStep(seasonId: string, i: number) {
    steps[seasonId] = (steps[seasonId] ?? []).filter((_, idx) => idx !== i)
  }

  function toggleExpanded(seasonId: string) {
    expanded[seasonId] = !expanded[seasonId]
  }
</script>

<svelte:head>
  <title>Scoring Schedules - Game Olympics</title>
</svelte:head>

<h1>Scoring Schedules</h1>

<Card.Root class="mt-6">
  <Card.Header>
    <Card.Title>Season Multiplier Schedules</Card.Title>
    <Card.Description>
      Configure point multipliers for each game session within a season. The nth multiplier applies
      when a game has been played n times in the season.
    </Card.Description>
  </Card.Header>
  <Card.Content>
    <div class="divide-y">
      {#each data.seasons as season (season.season_id)}
        <div class="py-4">
          <div class="flex items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <span class="font-medium">{season.season_name}</span>
              <SeasonStatusBadge seasonStatus={season.season_status} />
            </div>
            <div class="flex items-center gap-4">
              <span class="text-sm text-muted-foreground">{formatSchedule(season.multipliers)}</span
              >
              <Button variant="outline" size="sm" onclick={() => toggleExpanded(season.season_id)}>
                {expanded[season.season_id] ? 'Close' : 'Edit'}
              </Button>
            </div>
          </div>

          {#if expanded[season.season_id]}
            <form
              method="POST"
              action="?/upsertSchedule"
              class="mt-4 space-y-4 rounded-md border p-4"
              use:enhance={() => {
                saving[season.season_id] = true
                return async ({ update }) => {
                  saving[season.season_id] = false
                  update()
                }
              }}
            >
              <input type="hidden" name="season_id" value={season.season_id} />

              <div class="space-y-2">
                <p class="text-sm font-medium">Multiplier steps</p>
                {#each steps[season.season_id] ?? [1] as _step, i (i)}
                  <div class="flex items-center gap-2">
                    <span class="w-6 text-right text-sm text-muted-foreground">{i + 1}.</span>
                    <Input
                      type="number"
                      name="multipliers"
                      bind:value={steps[season.season_id][i]}
                      min="1"
                      required
                      class="w-24"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onclick={() => removeStep(season.season_id, i)}
                    >
                      Remove
                    </Button>
                  </div>
                {/each}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onclick={() => addStep(season.season_id)}
                >
                  Add Step
                </Button>
              </div>

              {#if form?.season_id === season.season_id && form?.errors?.multipliers}
                <p class="text-sm text-destructive">{form.errors.multipliers}</p>
              {/if}

              {#if form?.upsertSuccess && form?.season_id === season.season_id}
                <p class="text-sm text-green-600">Schedule saved.</p>
              {/if}

              <Button type="submit" disabled={saving[season.season_id]}>
                {saving[season.season_id] ? 'Saving...' : 'Save Schedule'}
              </Button>
            </form>
          {/if}
        </div>
      {:else}
        <p class="text-muted-foreground py-4">No seasons found.</p>
      {/each}
    </div>
  </Card.Content>
</Card.Root>
