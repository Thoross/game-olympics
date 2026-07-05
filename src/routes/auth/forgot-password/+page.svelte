<script lang="ts">
  import { Button } from '$lib/components/ui/button'
  import { Label } from '$lib/components/ui/label'
  import { Input } from '$lib/components/ui/input'
  import { Spinner } from '$lib/components/ui/spinner'
  import Alert from '$lib/components/Alert.svelte'
  import AuthCard from '$lib/components/AuthCard.svelte'
  import { enhance } from '$app/forms'
  import { resolve } from '$app/paths'

  let { form } = $props()

  let loading = $state(false)
</script>

<svelte:head>
  <title>Forgot Password - Game Olympics</title>
</svelte:head>

{#if form?.success}
  <AuthCard title="Reset password">
    <Alert
      type="default"
      message={`If an account exists for ${form.email}, a password reset link has been sent. Check your inbox.`}
    />
    {#snippet footer()}
      <p class="text-center">
        <a href={resolve('/auth/signin')} class="font-medium text-primary hover:underline"
          >Back to sign in</a
        >
      </p>
    {/snippet}
  </AuthCard>
{:else}
  <AuthCard title="Reset password" description="Enter your email and we'll send a reset link.">
    <form
      class="space-y-4"
      method="POST"
      action="?/forgot"
      novalidate
      use:enhance={() => {
        loading = true
        return async ({ update }) => {
          await update({ reset: false })
          loading = false
        }
      }}
    >
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

      <Button type="submit" disabled={loading} class="w-full">
        {#if loading}
          <Spinner />
        {/if}
        Send Reset Link
      </Button>
    </form>
    {#snippet footer()}
      <p class="text-center">
        <a href={resolve('/auth/signin')} class="font-medium text-primary hover:underline"
          >Back to sign in</a
        >
      </p>
    {/snippet}
  </AuthCard>
{/if}
