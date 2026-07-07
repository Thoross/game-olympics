<script lang="ts">
  // A wrapping legend rendered in normal flow below a chart, so it never
  // overlaps the plot the way LayerChart's absolutely-positioned legend does.
  let { items }: { items: { label: string; color: string }[] } = $props()
</script>

<div class="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs">
  {#each items as item (item.label)}
    <div class="flex items-center gap-1.5">
      <span class="size-2.5 rounded-[2px]" style="background-color: {item.color}"></span>
      <span>{item.label}</span>
    </div>
  {/each}
</div>
