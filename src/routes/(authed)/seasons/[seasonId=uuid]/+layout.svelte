<script lang="ts">
  import { page } from '$app/stores'
  import { resolve } from '$app/paths'
  import Button from '$lib/components/ui/button/button.svelte'
  import SeasonStatusBadge from '$lib/components/SeasonStatusBadge.svelte'

  let { data, children } = $props()

  const tabs = [
    { label: 'Standings', href: 'standings' },
    { label: 'Stats', href: 'stats' },
    { label: 'Sessions', href: 'sessions' },
    { label: 'Games', href: 'games' },
  ]

  let activeTab = $derived($page.url.pathname.split('/').at(-1) ?? 'standings')
  let isAdmin = $derived(data.user?.player_role === 'ADMIN')
</script>

<svelte:head>
  <title>{data?.seasonData?.season_name ?? 'Season'} - Game Olympics</title>
</svelte:head>

<div class="flex items-center justify-between">
  <div class="flex items-center gap-3">
    <h1>{data?.seasonData?.season_name}</h1>
    {#if data?.seasonData?.season_status}
      <SeasonStatusBadge seasonStatus={data.seasonData.season_status} />
    {/if}
  </div>
  {#if isAdmin && data.seasonData}
    <Button href={`/admin/sessions/add?season=${data.seasonData.season_id}`}>Add Session</Button>
  {/if}
</div>
{#if data?.seasonData?.season_description}
  <p class="mb-4 text-muted-foreground">{data.seasonData.season_description}</p>
{/if}

<div class="mb-6">
  <nav class="flex gap-1 border-b">
    {#each tabs as tab (tab.href)}
      {@const isActive = activeTab === tab.href}
      <a
        href={resolve(`/seasons/${$page.params.seasonId}/${tab.href}`)}
        class="-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors
          {isActive
          ? 'border-foreground text-foreground'
          : 'border-transparent text-muted-foreground hover:border-muted-foreground hover:text-foreground'}"
      >
        {tab.label}
      </a>
    {/each}
  </nav>
</div>

{@render children()}
