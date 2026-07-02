<script lang="ts">
  import ThemeToggle from '$lib/components/ThemeToggle.svelte'

  let { children } = $props()
</script>

<div
  class="relative flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 py-8"
>
  <div class="absolute top-4 right-4">
    <ThemeToggle />
  </div>
  <h1 class="text-2xl font-bold tracking-tight">Game Olympics</h1>
  {@render children()}
</div>
