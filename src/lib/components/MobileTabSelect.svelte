<script lang="ts">
  import * as Select from '$lib/components/ui/select'

  // Mobile-only dropdown that drives a Tabs.Root value. Hidden at sm+ where the
  // regular Tabs.List is shown instead.
  let {
    value = $bindable(),
    items,
  }: {
    value: string
    items: { value: string; label: string }[]
  } = $props()

  let selectedLabel = $derived(items.find((i) => i.value === value)?.label ?? '')
</script>

<Select.Root type="single" bind:value>
  <Select.Trigger class="w-full sm:hidden">{selectedLabel}</Select.Trigger>
  <Select.Content>
    {#each items as item (item.value)}
      <Select.Item value={item.value}>{item.label}</Select.Item>
    {/each}
  </Select.Content>
</Select.Root>
