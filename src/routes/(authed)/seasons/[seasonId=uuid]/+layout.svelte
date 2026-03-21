<script lang="ts">
  import { page } from '$app/stores'

  let { data, children } = $props()

  const tabs = [
    { label: 'Standings', href: 'standings' },
    { label: 'Stats', href: 'stats' },
    { label: 'Sessions', href: 'sessions' },
  ]

  let activeTab = $derived($page.url.pathname.split('/').at(-1) ?? 'standings')
</script>

<svelte:head>
  <title>{data?.seasonData?.season_name ?? 'Season'} - Game Olympics</title>
</svelte:head>

<h1>{data?.seasonData?.season_name}</h1>
{#if data?.seasonData?.season_description}
  <p class="text-muted-foreground mb-4">{data.seasonData.season_description}</p>
{/if}

<div class="mb-6">
  <nav class="flex gap-1 border-b">
    {#each tabs as tab}
      {@const isActive = activeTab === tab.href}
      <a
        href={tab.href}
        class="px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px
          {isActive
          ? 'border-foreground text-foreground'
          : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'}"
      >
        {tab.label}
      </a>
    {/each}
  </nav>
</div>

{@render children()}
