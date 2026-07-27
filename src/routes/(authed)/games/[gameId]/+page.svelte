<script lang="ts">
  import ExternalLink from '@lucide/svelte/icons/external-link'
  import RefreshCw from '@lucide/svelte/icons/refresh-cw'
  import { enhance } from '$app/forms'
  import { resolve } from '$app/paths'
  import Button from '$lib/components/ui/button/button.svelte'
  import Input from '$lib/components/ui/input/input.svelte'
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

  {#if data.isAdmin}
    <section class="flex flex-col gap-3">
      <h2 class="text-lg font-semibold">Metadata fields</h2>
      <p class="text-sm text-muted-foreground">
        Optional per-player fields recorded each session (e.g. Class, Faction).
      </p>

      {#if data.metadataFields.length > 0}
        <ul class="flex flex-col gap-2">
          {#each data.metadataFields as field (field.field_id)}
            <li class="flex items-center gap-2">
              <form
                method="POST"
                action="?/updateMetadataField"
                use:enhance
                class="flex flex-1 gap-2"
              >
                <input type="hidden" name="field_id" value={field.field_id} />
                <Input name="field_name" value={field.field_name} class="flex-1" />
                <Button type="submit" variant="outline" size="sm">Save</Button>
              </form>
              <form method="POST" action="?/removeMetadataField" use:enhance>
                <input type="hidden" name="field_id" value={field.field_id} />
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  class="text-muted-foreground hover:text-destructive"
                >
                  Delete
                </Button>
              </form>
            </li>
          {/each}
        </ul>
      {/if}

      <form method="POST" action="?/addMetadataField" use:enhance class="flex gap-2">
        <Input name="field_name" placeholder="New field name" class="flex-1" />
        <Button type="submit" variant="outline" size="sm">Add field</Button>
      </form>

      {#if form?.fieldError}
        <p class="text-sm text-destructive">{form.fieldError}</p>
      {/if}
    </section>
  {/if}

  {#if data.fieldBreakdowns.length > 0}
    <section class="flex flex-col gap-3">
      <h2 class="text-lg font-semibold">Recorded history</h2>
      {#each data.fieldBreakdowns as fb (fb.field_name)}
        <div class="flex flex-col gap-1">
          <h3 class="text-sm font-semibold">{fb.field_name}</h3>
          <ul class="text-sm text-muted-foreground">
            {#each fb.values as v (v.value)}
              <li>{v.value} — {v.count}×</li>
            {/each}
          </ul>
        </div>
      {/each}
    </section>
  {/if}
</div>
