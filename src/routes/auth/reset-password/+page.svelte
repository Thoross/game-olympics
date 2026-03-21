<svelte:head>
  <title>Reset Password - Game Olympics</title>
</svelte:head>

<script lang="ts">
  import { Button } from '$lib/components/ui/button'
  import { Label } from '$lib/components/ui/label'
  import { Input } from '$lib/components/ui/input'
  import { Spinner } from '$lib/components/ui/spinner'
  import Alert from '$lib/components/Alert.svelte'
  import { applyAction, enhance } from '$app/forms'
  import { page } from '$app/state'
  import { onMount } from 'svelte'

  let { form } = $props()

  let loading = $state(false)
  let sessionReady = $state(false)
  let sessionError = $state(false)

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

<div
  class="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800"
>
  <div class="w-full max-w-md">
    <div class="rounded-lg bg-white p-8 shadow-xl">
      <h1 class="mb-8 text-center text-3xl font-bold text-slate-900">Set New Password</h1>

      {#if form?.success}
        <Alert type="default" message="Your password has been updated successfully." />
        <p class="mt-6 text-center text-sm text-slate-600">
          <a href="/auth/signin" class="font-medium text-blue-600 hover:text-blue-700">
            Sign In
          </a>
        </p>
      {:else if sessionError}
        <Alert
          type="destructive"
          message="Invalid or expired reset link. Please request a new one."
        />
        <p class="mt-6 text-center text-sm text-slate-600">
          <a href="/auth/forgot-password" class="font-medium text-blue-600 hover:text-blue-700">
            Request New Reset Link
          </a>
        </p>
      {:else if !sessionReady}
        <div class="flex justify-center py-8">
          <Spinner />
        </div>
        <p class="text-center text-sm text-slate-600">Verifying reset link...</p>
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
          <div>
            <Label for="password">New Password</Label>
            <Input
              id="password"
              type="password"
              name="password"
              required
              placeholder="••••••••"
              disabled={loading}
            />
            {#if form?.errors?.password}
              <p class="mt-1 text-sm text-red-600">{form.errors.password}</p>
            {/if}
          </div>

          <div>
            <Label for="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              required
              placeholder="••••••••"
              disabled={loading}
            />
            {#if form?.errors?.confirmPassword}
              <p class="mt-1 text-sm text-red-600">{form.errors.confirmPassword}</p>
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
    </div>
  </div>
</div>
