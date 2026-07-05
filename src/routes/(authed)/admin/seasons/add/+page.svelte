<script lang="ts">
  import { enhance } from '$app/forms'
  import { resolve } from '$app/paths'
  import Button from '$lib/components/ui/button/button.svelte'
  import Input from '$lib/components/ui/input/input.svelte'
  import Label from '$lib/components/ui/label/label.svelte'
  import * as Select from '$lib/components/ui/select'

  let { form } = $props()

  const statusOptions = [
    { value: 'UPCOMING', label: 'Upcoming' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'SUSPENDED', label: 'Suspended' },
    { value: 'COMPLETED', label: 'Completed' },
  ]

  let seasonStatus = $state<string>('UPCOMING')
  let loading = $state(false)

  let selectedStatusLabel = $derived(
    statusOptions.find((s) => s.value === seasonStatus)?.label ?? seasonStatus,
  )
</script>

<svelte:head>
  <title>Add Season - Game Olympics</title>
</svelte:head>

<div class="mb-2">
  <a href={resolve('/admin/seasons')} class="text-sm text-muted-foreground hover:text-foreground">
    ← Season Management
  </a>
</div>
<h1>Add Season</h1>

<form
  method="POST"
  class="mt-6 flex max-w-sm flex-col gap-4"
  use:enhance={({ formData }) => {
    formData.set('seasonStatus', seasonStatus)
    loading = true
    return async ({ update }) => {
      loading = false
      update()
    }
  }}
>
  <div class="flex flex-col gap-1.5">
    <Label for="seasonName">Season Name</Label>
    <Input id="seasonName" name="seasonName" type="text" placeholder="Spring 2026" required />
    {#if form?.errors?.seasonName}
      <p class="text-sm text-destructive">{form.errors.seasonName}</p>
    {/if}
  </div>

  <div class="flex flex-col gap-1.5">
    <Label for="seasonDescription">
      Description <span class="text-muted-foreground">(optional)</span>
    </Label>
    <Input id="seasonDescription" name="seasonDescription" type="text" />
    {#if form?.errors?.seasonDescription}
      <p class="text-sm text-destructive">{form.errors.seasonDescription}</p>
    {/if}
  </div>

  <div class="flex flex-col gap-1.5">
    <Label>Status</Label>
    <Select.Root type="single" bind:value={seasonStatus}>
      <Select.Trigger class="w-full">{selectedStatusLabel}</Select.Trigger>
      <Select.Content>
        {#each statusOptions as opt (opt.value)}
          <Select.Item value={opt.value}>{opt.label}</Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
    {#if form?.errors?.seasonStatus}
      <p class="text-sm text-destructive">{form.errors.seasonStatus}</p>
    {/if}
  </div>

  {#if form?.message}
    <p class="text-sm text-destructive">{form.message}</p>
  {/if}

  <div class="flex gap-2">
    <Button type="submit" disabled={loading}>
      {loading ? 'Adding…' : 'Add Season'}
    </Button>
    <Button variant="outline" href="/admin/seasons">Cancel</Button>
  </div>
</form>
