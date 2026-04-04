<script lang="ts">
  import * as Sidebar from '$lib/components/ui/sidebar/index.js'
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js'
  import type { ComponentProps } from 'svelte'
  import ThemeToggle from './ThemeToggle.svelte'
  import { page } from '$app/state'
  import { goto, invalidateAll } from '$app/navigation'
  import LogOut from '@lucide/svelte/icons/log-out'

  let { ref = $bindable(null), ...restProps }: ComponentProps<typeof Sidebar.Root> = $props()

  let user = $derived(page.data.user)
  let playerName = $derived(user?.player_name || user?.email || 'User')
  let initial = $derived(playerName.charAt(0).toUpperCase())

  async function handleSignOut() {
    await page.data.supabase.auth.signOut()
    await invalidateAll()
    goto('/auth/signin')
  }

  let isAdmin = $derived(user?.player_role === 'ADMIN')

  let items = [
    {
      title: 'Seasons',
      url: '/seasons',
    },
    {
      title: 'Games',
      url: '/games',
    },
  ]

  let adminItems = [
    {
      title: 'Season Management',
      url: '/admin/seasons',
    },
    {
      title: 'Scoring Schedules',
      url: '/admin/scoring',
    },
    {
      title: 'Add Game',
      url: '/admin/games/add',
    },
    {
      title: 'Add Session',
      url: '/admin/sessions/add',
    },
    {
      title: 'Player Management',
      url: '/admin/players',
    },
  ]
</script>

<Sidebar.Root>
  <Sidebar.Header class="flex flex-row items-center justify-between">
    <h1 class="inline w-fit">Game Olympics</h1>
    <div class="inline w-fit">
      <ThemeToggle />
    </div>
  </Sidebar.Header>
  <Sidebar.Content>
    <Sidebar.Group>
      <Sidebar.Menu>
        {#each items as item (item.title)}
          <Sidebar.MenuItem>
            <Sidebar.MenuButton
              isActive={page.url.pathname.split('/')[1] === item.url.substring(1)}
            >
              {#snippet child({ props })}
                <a href={item.url} {...props}>{item.title}</a>
              {/snippet}
            </Sidebar.MenuButton>
          </Sidebar.MenuItem>
        {/each}
      </Sidebar.Menu>
    </Sidebar.Group>

    {#if isAdmin}
      <Sidebar.Group>
        <Sidebar.GroupLabel>Admin</Sidebar.GroupLabel>
        <Sidebar.Menu>
          {#each adminItems as item (item.title)}
            <Sidebar.MenuItem>
              <Sidebar.MenuButton isActive={page.url.pathname === item.url}>
                {#snippet child({ props })}
                  <a href={item.url} {...props}>{item.title}</a>
                {/snippet}
              </Sidebar.MenuButton>
            </Sidebar.MenuItem>
          {/each}
        </Sidebar.Menu>
      </Sidebar.Group>
    {/if}
  </Sidebar.Content>
  <Sidebar.Footer>
    <Sidebar.Menu>
      <Sidebar.MenuItem>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            {#snippet child({ props })}
              <Sidebar.MenuButton {...props} class="h-auto py-2">
                <div
                  class="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground"
                >
                  {initial}
                </div>
                <span class="truncate font-medium">{playerName}</span>
              </Sidebar.MenuButton>
            {/snippet}
          </DropdownMenu.Trigger>
          <DropdownMenu.Content side="top" class="w-full">
            <DropdownMenu.Item onclick={handleSignOut}>
              <LogOut class="mr-2 size-4" />
              Sign out
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </Sidebar.MenuItem>
    </Sidebar.Menu>
  </Sidebar.Footer>
  <Sidebar.Rail />
</Sidebar.Root>
