<script lang="ts">
  import { Button } from '$lib/components/ui/button'
  import { Label } from '$lib/components/ui/label'
  import { Input } from '$lib/components/ui/input'
  import { Spinner } from '$lib/components/ui/spinner'
  import Alert from '$lib/components/Alert.svelte'
  import AuthCard from '$lib/components/AuthCard.svelte'
  import { enhance } from '$app/forms'
  import { resolve } from '$app/paths'
  import { page } from '$app/state'

  let { form } = $props()

  let loading = $state(false)
  let justRegistered = $derived(page.url.searchParams.get('registered') === '1')
</script>

<svelte:head>
  <title>Sign In - Game Olympics</title>
</svelte:head>

<AuthCard title="Sign in" description="Welcome back to Game Olympics.">
  <form
    class="space-y-4"
    method="POST"
    action="?/signin"
    novalidate
    use:enhance={() => {
      loading = true
      return async ({ update }) => {
        await update({ reset: false })
        loading = false
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
    <div class="flex flex-col gap-2">
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
        <p class="mt-1 text-sm text-destructive">{form.errors.email}</p>
      {/if}
    </div>

    <div class="flex flex-col gap-2">
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
        <p class="mt-1 text-sm text-destructive">{form.errors.password}</p>
      {/if}
    </div>

    <div class="text-right">
      <a href={resolve('/auth/forgot-password')} class="text-sm font-medium text-primary hover:underline">
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
  {#snippet footer()}
    <p class="text-center text-muted-foreground">
      Don't have an account?
      <a href={resolve('/auth/register')} class="font-medium text-primary hover:underline">Register</a>
    </p>
  {/snippet}
</AuthCard>
