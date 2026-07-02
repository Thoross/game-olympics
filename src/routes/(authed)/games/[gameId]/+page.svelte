<script lang="ts">
  import ExternalLink from '@lucide/svelte/icons/external-link'

  let { data } = $props()
</script>

<svelte:head>
  <title>{data.game.game_name} - Game Olympics</title>
</svelte:head>

<h1>{data.game.game_name}</h1>

{#if data.game.game_bgg_url}
  <a
    href={data.game.game_bgg_url}
    target="_blank"
    rel="noopener noreferrer"
    class="text-sm text-muted-foreground underline hover:text-foreground"
  >
    <span class="flex flex-row items-center gap-1">BGG <ExternalLink size="16" /></span>
  </a>
{/if}
