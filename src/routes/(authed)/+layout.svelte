<script lang="ts">
  import favicon from '$lib/assets/favicon.svg'
  import * as Sidebar from '$lib/components/ui/sidebar'
  import MainSidebar from '$lib/components/main-sidebar.svelte'
  import Separator from '$lib/components/ui/separator/separator.svelte'
  import Breadcrumbs from '$lib/components/Breadcrumbs.svelte'

  let { children } = $props()
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<Sidebar.Provider>
  <MainSidebar />
  <Sidebar.Inset>
    <header class="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <Sidebar.Trigger class="-ms-1" />
      <Separator orientation="vertical" />
      <Breadcrumbs />
    </header>
    <div class="px-8 py-5">
      {@render children()}
    </div>
  </Sidebar.Inset>
</Sidebar.Provider>
