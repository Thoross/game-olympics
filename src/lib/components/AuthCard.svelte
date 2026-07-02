<script lang="ts">
  import type { Snippet } from 'svelte'
  import * as Card from '$lib/components/ui/card'

  let {
    title,
    description,
    children,
    footer,
  }: {
    title: string
    description?: string
    children: Snippet
    footer?: Snippet
  } = $props()
</script>

<Card.Root class="w-full max-w-md">
  <Card.Header>
    <Card.Title>{title}</Card.Title>
    {#if description}
      <Card.Description>{description}</Card.Description>
    {/if}
  </Card.Header>
  <Card.Content>
    {@render children()}
  </Card.Content>
  {#if footer}
    <Card.Footer class="flex flex-col gap-2 text-sm">
      {@render footer()}
    </Card.Footer>
  {/if}
</Card.Root>
