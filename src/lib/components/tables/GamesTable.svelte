<script lang="ts">
  import * as Table from '$lib/components/ui/table'
  import Button from '$lib/components/ui/button/button.svelte'
  import { createSvelteTable, FlexRender } from '$lib/components/ui/data-table/index.js'
  import ExternalLink from '@lucide/svelte/icons/external-link'
  import {
    getCoreRowModel,
    getPaginationRowModel,
    type ColumnDef,
    type PaginationState,
  } from '@tanstack/table-core'

  type Game = {
    game_id: string
    game_name: string
    game_bgg_url: string | null
  }

  let { games }: { games: Game[] } = $props()

  let pagination = $state<PaginationState>({ pageIndex: 0, pageSize: 10 })

  const columns: ColumnDef<Game>[] = [
    {
      accessorKey: 'game_name',
      header: 'Name',
      cell: ({ row }) => row.original.game_name,
    },
    {
      accessorKey: 'game_bgg_url',
      header: 'BGG Link',
      cell: ({ row }) => row.original.game_bgg_url ?? '',
    },
  ]

  const table = createSvelteTable({
    get data() {
      return games
    },
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    get state() {
      return { pagination }
    },
    onPaginationChange: (updater) => {
      pagination = typeof updater === 'function' ? updater(pagination) : updater
    },
  })
</script>

<div class="flex flex-col gap-4">
  <div class="rounded-md border">
    <Table.Root>
      <Table.Header>
        {#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
          <Table.Row>
            {#each headerGroup.headers as header (header.id)}
              <Table.Head colspan={header.colSpan}>
                {#if !header.isPlaceholder}
                  <FlexRender
                    content={header.column.columnDef.header}
                    context={header.getContext()}
                  />
                {/if}
              </Table.Head>
            {/each}
          </Table.Row>
        {/each}
      </Table.Header>
      <Table.Body>
        {#each table.getRowModel().rows as row (row.id)}
          <Table.Row>
            <Table.Cell>
              <a href="/games/{row.original.game_id}" class="hover:underline">
                {row.original.game_name}
              </a>
            </Table.Cell>
            <Table.Cell>
              {#if row.original.game_bgg_url}
                <a
                  href={row.original.game_bgg_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  class=" text-sm text-muted-foreground underline hover:text-foreground"
                >
                  <span class="flex flex-row items-center gap-1"
                    >BGG <ExternalLink size="16" /></span
                  >
                </a>
              {/if}
            </Table.Cell>
          </Table.Row>
        {:else}
          <Table.Row>
            <Table.Cell colspan={2} class="h-24 text-center">No games found.</Table.Cell>
          </Table.Row>
        {/each}
      </Table.Body>
    </Table.Root>
  </div>

  <div class="flex items-center justify-between">
    <p class="text-sm text-muted-foreground">
      {table.getCoreRowModel().rows.length} game{table.getCoreRowModel().rows.length === 1
        ? ''
        : 's'}
    </p>
    <div class="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onclick={() => table.previousPage()}
        disabled={!table.getCanPreviousPage()}
      >
        Previous
      </Button>
      <span class="text-sm">
        Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
      </span>
      <Button
        variant="outline"
        size="sm"
        onclick={() => table.nextPage()}
        disabled={!table.getCanNextPage()}
      >
        Next
      </Button>
    </div>
  </div>
</div>
