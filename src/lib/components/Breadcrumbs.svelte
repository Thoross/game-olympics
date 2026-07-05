<script lang="ts">
  import { page } from '$app/state'
  import * as Breadcrumbs from '$lib/components/ui/breadcrumb'

  /**
   * Maps route parameter names to a function that resolves a display label from page data.
   * Add entries here when new parameterized routes are created.
   */
  const paramLabelResolvers: Record<string, (data: Record<string, unknown>) => string | undefined> =
    {
      gameId: (data) => (data.game as { game_name?: string } | undefined)?.game_name,
      // `seasonData` on the public season route; `season` on the admin edit route.
      seasonId: (data) =>
        (data.seasonData as { season_name?: string } | undefined)?.season_name ??
        (data.season as { season_name?: string } | undefined)?.season_name,
    }

  let segments = $derived(page.url.pathname.split('/').filter((segment) => segment.length > 0))

  let routeSegments = $derived(
    (page.route.id ?? '')
      .split('/')
      .filter((segment) => segment.length > 0 && !segment.startsWith('(')),
  )

  let breadcrumbItems = $derived([
    { label: 'Home', href: '/' },
    ...segments.map((segment, index) => {
      const href = '/' + segments.slice(0, index + 1).join('/')
      const routeSegment = routeSegments[index]
      const label = resolveLabel(segment, routeSegment)
      return { label, href }
    }),
  ])

  function resolveLabel(segment: string, routeSegment: string | undefined): string {
    if (routeSegment) {
      const paramMatch = routeSegment.match(/^\[([a-zA-Z]+)(?:=.+)?\]$/)
      if (paramMatch) {
        const paramName = paramMatch[1]
        const resolved = paramLabelResolvers[paramName]?.(page.data)
        if (resolved) return resolved
      }
    }
    return segment.charAt(0).toUpperCase() + segment.slice(1)
  }
</script>

<Breadcrumbs.Root>
  <Breadcrumbs.List>
    {#each breadcrumbItems as item, index (item.href)}
      <Breadcrumbs.Item>
        {#if index === breadcrumbItems.length - 1}
          <Breadcrumbs.Page>{item.label}</Breadcrumbs.Page>
        {:else}
          <Breadcrumbs.Link href={item.href}>{item.label}</Breadcrumbs.Link>
        {/if}
      </Breadcrumbs.Item>
      {#if index < breadcrumbItems.length - 1}
        <Breadcrumbs.Separator />
      {/if}
    {/each}
  </Breadcrumbs.List>
</Breadcrumbs.Root>
