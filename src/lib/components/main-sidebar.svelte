<script lang="ts">
  import * as Sidebar from '$lib/components/ui/sidebar/index.js'
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js'
  import type { ComponentProps } from 'svelte'
  import ThemeToggle from './ThemeToggle.svelte'
  import { page } from '$app/state'
  import { goto, invalidateAll } from '$app/navigation'
  import { resolve } from '$app/paths'
  import LogOut from '@lucide/svelte/icons/log-out'

  let { ref = $bindable(null), ...restProps }: ComponentProps<typeof Sidebar.Root> = $props()

  let user = $derived(page.data.user)
  let playerName = $derived(user?.player_name || user?.email || 'User')
  let initial = $derived(playerName.charAt(0).toUpperCase())

  async function handleSignOut() {
    await page.data.supabase.auth.signOut()
    await invalidateAll()
    goto(resolve('/auth/signin'))
  }

  let isAdmin = $derived(user?.player_role === 'ADMIN')
  let inProgressSeasons = $derived(page.data.inProgressSeasons ?? [])

  // True when viewing one of the in-progress seasons (which has its own active
  // sub-link) — used to avoid also highlighting the top-level "Seasons" item.
  let inInProgressSeason = $derived(
    inProgressSeasons.some((s: { season_id: string }) =>
      page.url.pathname.startsWith(`/seasons/${s.season_id}`),
    ),
  )

  const sidebar = Sidebar.useSidebar()

  function closeMobileNav() {
    if (sidebar.isMobile) sidebar.setOpenMobile(false)
  }

  let items = [
    {
      title: 'Seasons',
      url: '/seasons',
    },
    {
      title: 'Games',
      url: '/games',
    },
  ] as const

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
  ] as const
</script>

<Sidebar.Root bind:ref {...restProps}>
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
              isActive={page.url.pathname.split('/')[1] === item.url.substring(1) &&
                !(item.title === 'Seasons' && inInProgressSeason)}
            >
              {#snippet child({ props })}
                <a href={resolve(item.url)} {...props} onclick={closeMobileNav}>{item.title}</a>
              {/snippet}
            </Sidebar.MenuButton>
            {#if item.title === 'Seasons' && inProgressSeasons.length > 0}
              <Sidebar.MenuSub class="pt-1">
                {#each inProgressSeasons as season (season.season_id)}
                  <Sidebar.MenuSubItem>
                    <Sidebar.MenuSubButton
                      isActive={page.url.pathname.startsWith(`/seasons/${season.season_id}`)}
                    >
                      {#snippet child({ props })}
                        <a
                          href={resolve(`/seasons/${season.season_id}`)}
                          {...props}
                          onclick={closeMobileNav}
                        >
                          {#if season.season_logo_url}
                            <img
                              src={season.season_logo_url}
                              alt=""
                              class="size-4 shrink-0 rounded-[3px] object-cover"
                            />
                          {/if}
                          <span>{season.season_name}</span>
                        </a>
                      {/snippet}
                    </Sidebar.MenuSubButton>
                  </Sidebar.MenuSubItem>
                {/each}
              </Sidebar.MenuSub>
            {/if}
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
                  <a href={resolve(item.url)} {...props} onclick={closeMobileNav}>{item.title}</a>
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
