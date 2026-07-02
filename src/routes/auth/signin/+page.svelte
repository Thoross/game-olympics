<script lang="ts">
  import { Button } from '$lib/components/ui/button'
  import { Label } from '$lib/components/ui/label'
  import { Input } from '$lib/components/ui/input'
  import { Spinner } from '$lib/components/ui/spinner'
  import Alert from '$lib/components/Alert.svelte'
  import { applyAction, enhance } from '$app/forms'
  import { page } from '$app/state'

  let { form } = $props()

  let loading = $state(false)
  let justRegistered = $derived(page.url.searchParams.get('registered') === '1')
</script>

<svelte:head>
  <title>Sign In - Game Olympics</title>
</svelte:head>

<div
  class="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800"
>
  <div class="w-full max-w-md">
    <div class="rounded-lg bg-white p-8 shadow-xl">
      <h1 class="mb-8 text-center text-3xl font-bold text-slate-900">Sign In</h1>

      <form
        class="space-y-4"
        method="POST"
        action="?/signin"
        use:enhance={() => {
          loading = true
          return async ({ result }) => {
            loading = false
            applyAction(result)
          }
        }}
      >
        {#if justRegistered && !form?.message}
          <Alert
            type="default"
            message="Account created. Check your email to confirm your address, then sign in."
          />
        {/if}
        {#if form?.message}
          <Alert type="destructive" message={form.message} />
        {/if}
        <div>
          <Label for="email">Email</Label>
          <Input
            id="email"
            type="email"
            name="email"
            required
            placeholder="you@example.com"
            disabled={loading}
          />
          {#if form?.errors?.email}
            <p class="mt-1 text-sm text-red-600">{form.errors.email}</p>
          {/if}
        </div>

        <div>
          <Label for="password">Password</Label>
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

        <div class="text-right">
          <a
            href="/auth/forgot-password"
            class="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Forgot password?
          </a>
        </div>

        <Button type="submit" disabled={loading} class="w-full">
          {#if loading}
            <Spinner />
          {/if}
          Sign In
        </Button>
      </form>

      <p class="mt-6 text-center text-sm text-slate-600">
        Don't have an account?
        <a href="/auth/register" class="font-medium text-blue-600 hover:text-blue-700">
          Register here
        </a>
      </p>
    </div>
  </div>
</div>
