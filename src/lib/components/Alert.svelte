<script lang="ts">
  import * as Alert from '$lib/components/ui/alert/index'
  import AlertCircleIcon from '@lucide/svelte/icons/alert-circle'

  let {
    type = 'default',
    message,
    header,
  }: { type: 'default' | 'destructive'; message: string; header?: string } = $props()
</script>

<Alert.Root class="w-full" variant={type}>
  <AlertCircleIcon />
  {#if header}
    <Alert.Title>{header}</Alert.Title>
  {/if}
  <Alert.Description>{message}</Alert.Description>
</Alert.Root>
