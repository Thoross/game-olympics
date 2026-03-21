<script lang="ts">
  import type { ColumnDef } from '@tanstack/table-core'
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
}: {
  name: Season['season_name']
  season_id: Season['season_id']
})}
  <span><a href="/seasons/{season_id}">{name}</a></span>
{/snippet}
