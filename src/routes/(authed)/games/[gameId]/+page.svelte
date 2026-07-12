<script lang="ts">
  import ExternalLink from '@lucide/svelte/icons/external-link'
  import RefreshCw from '@lucide/svelte/icons/refresh-cw'
  import { enhance } from '$app/forms'
  import { resolve } from '$app/paths'
  import Button from '$lib/components/ui/button/button.svelte'
  import * as Card from '$lib/components/ui/card'
  import * as Tabs from '$lib/components/ui/tabs'

  let { data, form } = $props()

  let refreshing = $state(false)

  // Trim a fractional value to at most one decimal, dropping a trailing ".0".
  function fmt(n: number): string {
    return Number(n.toFixed(1)).toString()
  }
</script>

<svelte:head>
  <title>{data.game.game_name} - Game Olympics</title>
</svelte:head>

<div class="flex flex-col gap-6">
  <div class="flex flex-col gap-4 sm:flex-row sm:items-start">
    {#if data.game.game_image_url}
      <img
        src={data.game.game_image_url}
        alt="{data.game.game_name} box art"
        class="w-full max-w-[12rem] rounded-lg border object-contain"
      />
    {/if}

    <div class="flex flex-col gap-2">
      <h1>{data.game.game_name}</h1>

      <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        {#if data.game.game_bgg_rating != null}
          <span>⭐ {fmt(data.game.game_bgg_rating)}</span>
        {/if}
        {#if data.game.game_year_published != null}
          <span>Released {data.game.game_year_published}</span>
        {/if}
        {#if data.game.game_bgg_url}
          <a
            href={data.game.game_bgg_url}
            target="_blank"
            rel="noopener noreferrer"
            class="underline hover:text-foreground"
          >
            <span class="flex flex-row items-center gap-1">BGG <ExternalLink size="16" /></span>
          </a>
        {/if}
      </div>

      {#if data.isAdmin}
        <form
          method="POST"
          action="?/refreshBgg"
          use:enhance={() => {
            refreshing = true
            return async ({ update }) => {
              refreshing = false
              update()
            }
          }}
        >
          <Button type="submit" variant="outline" size="sm" disabled={refreshing}>
            <RefreshCw size="16" class={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing…' : 'Refresh from BGG'}
          </Button>
        </form>
        {#if form?.message}
          <p class="text-sm text-destructive">{form.message}</p>
        {/if}
      {/if}
    </div>
  </div>

  {#if data.game.game_description}
    <p class="text-sm whitespace-pre-line">{data.game.game_description}</p>
  {/if}

  <section class="flex flex-col gap-3">
    <h2 class="text-lg font-semibold">Your season stats</h2>

    {#if data.seasonStats.length === 0}
      <p class="text-sm text-muted-foreground">You haven't played this game yet.</p>
    {:else}
      <Tabs.Root value={data.seasonStats[0].season_id}>
        <Tabs.List>
          {#each data.seasonStats as stat (stat.season_id)}
            <Tabs.Trigger value={stat.season_id}>{stat.season_name}</Tabs.Trigger>
          {/each}
        </Tabs.List>

        {#each data.seasonStats as stat (stat.season_id)}
          <Tabs.Content value={stat.season_id}>
            <Card.Root>
              <Card.Content class="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <div class="text-xs text-muted-foreground">Times played</div>
                  <div class="text-2xl font-semibold">{stat.times_played}</div>
                </div>
                <div>
                  <div class="text-xs text-muted-foreground">Average score</div>
                  <div class="text-2xl font-semibold">{fmt(stat.avg_score)}</div>
                </div>
                <div>
                  <div class="text-xs text-muted-foreground">Average position</div>
                  <div class="text-2xl font-semibold">{fmt(stat.avg_position)}</div>
                </div>
                <div>
                  <div class="text-xs text-muted-foreground">Standings points</div>
                  <div class="text-2xl font-semibold">{fmt(stat.total_standings_points)}</div>
                </div>
              </Card.Content>
              <Card.Footer>
                <a
                  href={resolve(`/seasons/${stat.season_id}`)}
                  class="text-sm text-muted-foreground hover:text-foreground hover:underline"
                >
                  View {stat.season_name} →
                </a>
              </Card.Footer>
            </Card.Root>
          </Tabs.Content>
        {/each}
      </Tabs.Root>
    {/if}
  </section>
</div>
