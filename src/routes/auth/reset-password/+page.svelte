<script lang="ts">
  import { Button } from '$lib/components/ui/button'
  import { Label } from '$lib/components/ui/label'
  import { Input } from '$lib/components/ui/input'
  import { Spinner } from '$lib/components/ui/spinner'
  import Alert from '$lib/components/Alert.svelte'
  import AuthCard from '$lib/components/AuthCard.svelte'
  import PasswordRules from '$lib/components/PasswordRules.svelte'
  import { applyAction, enhance } from '$app/forms'
  import { page } from '$app/state'
  import { onMount } from 'svelte'

  let { form } = $props()

  let loading = $state(false)
  let sessionReady = $state(false)
  let sessionError = $state(false)
  let password = $state('')
  let confirmPassword = $state('')

  onMount(() => {
    const supabase = page.data.supabase

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: string) => {
      if (event === 'PASSWORD_RECOVERY') {
        sessionReady = true
      }
    })

    // Fallback: check if session already exists
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: unknown } }) => {
      if (session) {
        sessionReady = true
      }
    })

    // Timeout: show error if no session detected
    const timeout = setTimeout(() => {
      if (!sessionReady) {
        sessionError = true
      }
    }, 5000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  })
</script>

<svelte:head>
  <title>Reset Password - Game Olympics</title>
</svelte:head>

<AuthCard title="Set new password">
  {#if form?.success}
    <Alert type="default" message="Your password has been updated." />
    <p class="mt-4 text-center text-sm">
      <a href="/auth/signin" class="font-medium text-primary hover:underline">Sign in</a>
    </p>
  {:else if sessionError}
    <Alert type="destructive" message="Invalid or expired reset link. Please request a new one." />
    <p class="mt-4 text-center text-sm">
      <a href="/auth/forgot-password" class="font-medium text-primary hover:underline">
        Request new reset link
      </a>
    </p>
  {:else if !sessionReady}
    <div class="flex justify-center py-8">
      <Spinner />
    </div>
    <p class="text-center text-sm text-muted-foreground">Verifying reset link...</p>
  {:else}
    <form
      class="space-y-4"
      method="POST"
      action="?/reset"
      use:enhance={() => {
        loading = true
        return async ({ result }) => {
          loading = false
          applyAction(result)
        }
      }}
    >
      {#if form?.message}
        <Alert type="destructive" message={form.message} />
      {/if}
      <div class="flex flex-col gap-2">
        <Label for="password">New Password</Label>
        <Input
          id="password"
          type="password"
          name="password"
          required
          placeholder="••••••••"
          disabled={loading}
          bind:value={password}
        />
        {#if form?.errors?.password}
          <p class="mt-1 text-sm text-destructive">{form.errors.password}</p>
        {/if}
        <PasswordRules {password} {confirmPassword} />
      </div>

      <div class="flex flex-col gap-2">
        <Label for="confirmPassword">Confirm New Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          name="confirmPassword"
          required
          placeholder="••••••••"
          disabled={loading}
          bind:value={confirmPassword}
        />
        {#if form?.errors?.confirmPassword}
          <p class="mt-1 text-sm text-destructive">{form.errors.confirmPassword}</p>
        {/if}
      </div>

      <Button type="submit" disabled={loading} class="w-full">
        {#if loading}
          <Spinner />
        {/if}
        Update Password
      </Button>
    </form>
  {/if}
</AuthCard>
