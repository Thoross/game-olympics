<script lang="ts">
  import { Check, Circle } from '@lucide/svelte'

  let { password, confirmPassword }: { password: string; confirmPassword?: string } = $props()

  let rules = $derived([
    { label: 'At least 6 characters', met: password.length >= 6 },
    ...(confirmPassword !== undefined
      ? [
          {
            label: 'Passwords match',
            met: password.length > 0 && password === confirmPassword,
          },
        ]
      : []),
  ])
</script>

<ul class="mt-2 space-y-1 text-sm">
  {#each rules as rule (rule.label)}
    <li class="flex items-center gap-2 {rule.met ? 'text-primary' : 'text-muted-foreground'}">
      {#if rule.met}
        <Check class="size-4" />
      {:else}
        <Circle class="size-4" />
      {/if}
      {rule.label}
    </li>
  {/each}
</ul>
