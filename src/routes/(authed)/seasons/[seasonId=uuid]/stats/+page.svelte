<script lang="ts">
  import { LineChart, Tooltip } from 'layerchart'
  import { format } from '@layerstack/utils'
  import * as Table from '$lib/components/ui/table'
  import * as Tabs from '$lib/components/ui/tabs'
  import * as Card from '$lib/components/ui/card'
  import { ChartContainer, type ChartConfig } from '$lib/components/ui/chart'

  let { data } = $props()

  const CHART_COLORS = [
    'var(--chart-1)',
    'var(--chart-2)',
    'var(--chart-3)',
    'var(--chart-4)',
    'var(--chart-5)',
  ]

  function ordinal(n: number): string {
    const s = ['th', 'st', 'nd', 'rd']
    const v = n % 100
    return n + (s[(v - 20) % 10] ?? s[v] ?? s[0])
  }

  const chartConfig: ChartConfig = $derived(
    Object.fromEntries(
      data.players.map((p: { player_id: string; player_name: string }, i: number) => [
        p.player_id,
        { label: p.player_name, color: CHART_COLORS[i % CHART_COLORS.length] },
      ]),
    ),
  )

  const playerSeries = $derived(
    data.players.map((p: { player_id: string; player_name: string }, i: number) => ({
      key: p.player_id,
      label: p.player_name,
      color: CHART_COLORS[i % CHART_COLORS.length],
      value: (d: Record<string, number | string>) => (d[p.player_id] as number) ?? 0,
    })),
  )

  function gameSeriesFor(playerIds: string[]) {
    return data.players
      .filter((p: { player_id: string }) => playerIds.includes(p.player_id))
      .map((p: { player_id: string; player_name: string }) => {
        const colorIdx = data.players.findIndex(
          (pl: { player_id: string }) => pl.player_id === p.player_id,
        )
        return {
          key: p.player_id,
          label: p.player_name,
          color: CHART_COLORS[colorIdx % CHART_COLORS.length],
          value: (d: Record<string, number | string>) => (d[p.player_id] as number) ?? 0,
        }
      })
  }

  function gameChartConfigFor(playerIds: string[]): ChartConfig {
    return Object.fromEntries(
      data.players
        .filter((p: { player_id: string }) => playerIds.includes(p.player_id))
        .map((p: { player_id: string; player_name: string }, i: number) => [
          p.player_id,
          { label: p.player_name, color: CHART_COLORS[i % CHART_COLORS.length] },
        ]),
    )
  }
</script>

<div class="flex flex-col gap-10">
  <!-- Session scores breakdown -->
  <Card.Root>
    <Card.Header>
      <h3 class="mb-3 text-base font-semibold">Scores per Session</h3>
    </Card.Header>
    <Card.Content>
      {#if data.sessionBreakdowns.length === 0}
        <div
          class="flex h-24 items-center justify-center rounded-md border text-sm text-muted-foreground"
        >
          No sessions yet.
        </div>
      {:else}
        <Tabs.Root value={data.sessionBreakdowns[0].session_id} class="gap-6">
          <Tabs.List>
            {#each data.sessionBreakdowns as session, i}
              <Tabs.Trigger
                value={session.session_id}
                class="data-[state='active']:text-primary-foreground data-[state=active]:bg-primary"
              >
                {session.game_name}
                {i + 1}
              </Tabs.Trigger>
            {/each}
          </Tabs.List>
          {#each data.sessionBreakdowns as session}
            <Tabs.Content value={session.session_id}>
              <Table.Root>
                <Table.Header>
                  <Table.Row>
                    <Table.Head>Player</Table.Head>
                    <Table.Head class="text-right">Score</Table.Head>
                    <Table.Head class="text-right">Position</Table.Head>
                    <Table.Head class="text-right">Points</Table.Head>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {#each session.players as player}
                    <Table.Row>
                      <Table.Cell>{player.player_name}</Table.Cell>
                      <Table.Cell class="text-right">{player.score}</Table.Cell>
                      <Table.Cell class="text-right">{ordinal(player.position)}</Table.Cell>
                      <Table.Cell class="text-right">{player.standings_points} pts</Table.Cell>
                    </Table.Row>
                  {/each}
                </Table.Body>
              </Table.Root>
            </Tabs.Content>
          {/each}
        </Tabs.Root>
      {/if}
    </Card.Content>
  </Card.Root>

  <!-- Standings over time -->
  {#if data.standingsOverTime.length > 0}
    <Card.Root>
      <Card.Header>
        <Card.Title>Points Over Time</Card.Title>
      </Card.Header>
      <Card.Content>
        <ChartContainer config={chartConfig} class="h-64 w-full">
          <LineChart
            data={data.standingsOverTime}
            x={(d) => d.label}
            series={playerSeries}
            legend
            points
          >
            {#snippet tooltip({ context })}
              {@const rows = context.tooltip.series
                .filter((s) => s.visible)
                .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))}
              <Tooltip.Root {context}>
                <Tooltip.Header value={context.x(context.tooltip.data)} {format} />
                <Tooltip.List>
                  {#each rows as s (s.key)}
                    <Tooltip.Item
                      label={s.label}
                      value={s.value}
                      color={s.color}
                      {format}
                      valueAlign="right"
                    />
                  {/each}
                </Tooltip.List>
              </Tooltip.Root>
            {/snippet}
          </LineChart>
        </ChartContainer>
      </Card.Content>
    </Card.Root>
  {/if}

  <!-- Game stats table -->
  <Card.Root class="gap-0 overflow-hidden">
    <Card.Header>
      <Card.Title>Game Stats</Card.Title>
    </Card.Header>
    <Card.Content>
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.Head>Game</Table.Head>
            <Table.Head class="text-right">Times Played</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#each data.gameStats as stat}
            <Table.Row>
              <Table.Cell>{stat.game_name}</Table.Cell>
              <Table.Cell class="text-right">{stat.times_played}</Table.Cell>
            </Table.Row>
          {:else}
            <Table.Row>
              <Table.Cell colspan={2} class="h-24 text-center">No stats yet.</Table.Cell>
            </Table.Row>
          {/each}
        </Table.Body>
      </Table.Root>
    </Card.Content>
  </Card.Root>

  <!-- Score per game -->
  {#if data.scoresByGame.length > 0}
    <Card.Root>
      <Card.Header>
        <Card.Title>Score per Game</Card.Title>
      </Card.Header>
      <Card.Content>
        <Tabs.Root value={data.scoresByGame[0].game_id} class="gap-6">
          <Tabs.List>
            {#each data.scoresByGame as game}
              <Tabs.Trigger value={game.game_id}>{game.game_name}</Tabs.Trigger>
            {/each}
          </Tabs.List>
          {#each data.scoresByGame as game}
            <Tabs.Content value={game.game_id}>
              <ChartContainer config={gameChartConfigFor(game.playerIds)} class="h-64 w-full">
                <LineChart
                  data={game.sessions}
                  x={(d) => d.label}
                  series={gameSeriesFor(game.playerIds)}
                  legend
                  points
                >
                  {#snippet tooltip({ context })}
                    {@const rows = context.tooltip.series
                      .filter((s) => s.visible)
                      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))}
                    <Tooltip.Root {context}>
                      <Tooltip.Header value={context.x(context.tooltip.data)} {format} />
                      <Tooltip.List>
                        {#each rows as s (s.key)}
                          <Tooltip.Item
                            label={s.label}
                            value={s.value}
                            color={s.color}
                            {format}
                            valueAlign="right"
                          />
                        {/each}
                      </Tooltip.List>
                    </Tooltip.Root>
                  {/snippet}
                </LineChart>
              </ChartContainer>
            </Tabs.Content>
          {/each}
        </Tabs.Root>
      </Card.Content>
    </Card.Root>
  {/if}
</div>
