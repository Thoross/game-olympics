<script lang="ts">
  import type { ColumnDef } from '@tanstack/table-core'
  import { resolve } from '$app/paths'
  import { type Database } from '$lib/database.types'
  import Table from '../Table.svelte'
  import { renderSnippet } from '../ui/data-table'
  import SeasonStatusBadge from '../SeasonStatusBadge.svelte'

  let { data } = $props()

  type Season = {
    season_id: string
    season_name: string
    season_description: string | null
    season_status: Database['public']['Enums']['Season Status'] | undefined
    season_logo_url: string | null
    created_at: string
  }

  const columns: ColumnDef<Season>[] = [
    {
      accessorKey: 'season_name',
      header: 'Name',
      cell: ({ row }) => {
        return renderSnippet(SeasonNameCell, {
          name: row.original.season_name,
          season_id: row.original.season_id,
          season_logo_url: row.original.season_logo_url,
        })
      },
    },
    {
      accessorKey: 'season_description',
      header: 'Description',
    },
    {
      accessorKey: 'season_status',
      header: 'Status',
      cell: ({ row }) => {
        return renderSnippet(StatusCell, { status: row.original.season_status })
      },
    },
  ]
</script>

<Table data={data?.seasons ?? []} {columns} />

{#snippet StatusCell({ status }: { status: Season['season_status'] })}
  <SeasonStatusBadge seasonStatus={status ?? 'UPCOMING'} />
{/snippet}

{#snippet SeasonNameCell({
  name,
  season_id,
  season_logo_url,
}: {
  name: Season['season_name']
  season_id: Season['season_id']
  season_logo_url: Season['season_logo_url']
})}
  <span class="flex items-center gap-2">
    {#if season_logo_url}
      <img src={season_logo_url} alt="{name} logo" class="h-6 w-6 rounded border object-cover" />
    {/if}
    <a href={resolve(`/seasons/${season_id}`)}>{name}</a>
  </span>
{/snippet}
