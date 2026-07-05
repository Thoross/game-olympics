<script lang="ts">
  import SeasonsTable from '$lib/components/tables/SeasonsTable.svelte'
  import Button from '$lib/components/ui/button/button.svelte'
  import FieldLabel from '$lib/components/ui/field/field-label.svelte'
  import Field from '$lib/components/ui/field/field.svelte'
  import Input from '$lib/components/ui/input/input.svelte'
  import * as Select from '$lib/components/ui/select'

  let { data } = $props()

  const statusLabels: Record<string, string> = {
    '': 'All',
    UPCOMING: 'Upcoming',
    IN_PROGRESS: 'In Progress',
    SUSPENDED: 'Suspended',
    COMPLETED: 'Completed',
  }

  let status = $state('')
</script>

<svelte:head>
  <title>Seasons - Game Olympics</title>
</svelte:head>

<h1>Seasons</h1>

<div class="mt-4 mb-4">
  <form method="GET" class="flex flex-row gap-6">
    <div class="flex flex-col">
      <Field>
        <FieldLabel for="nameFilter">Name</FieldLabel>
        <Input id="nameFilter" placeholder="Filter by name" name="season-name" />
      </Field>
    </div>

    <div class="flex flex-col">
      <Field>
        <FieldLabel for="statusFilter">Status</FieldLabel>
        <Select.Root name="season-status" bind:value={status} type="single">
          <Select.Trigger id="statusFilter">
            {statusLabels[status] ?? 'All'}
          </Select.Trigger>
          <Select.Content>
            {#each Object.entries(statusLabels) as [value, label] (value)}
              <Select.Item {value}>{label}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      </Field>
    </div>

    <Button type="submit" class="cursor-pointer self-end">Apply Filters</Button>
  </form>
</div>

<!-- Table (use shadcn-svelte Table components if available; simple markup here) -->
<SeasonsTable {data} />
