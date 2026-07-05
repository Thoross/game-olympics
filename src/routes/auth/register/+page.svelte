<script lang="ts">
  import { enhance } from '$app/forms'
  import { resolve } from '$app/paths'
  import { Button } from '$lib/components/ui/button'
  import { Input } from '$lib/components/ui/input'
  import Label from '$lib/components/ui/label/label.svelte'
  import { Spinner } from '$lib/components/ui/spinner'
  import Alert from '$lib/components/Alert.svelte'
  import AuthCard from '$lib/components/AuthCard.svelte'
  import PasswordRules from '$lib/components/PasswordRules.svelte'

  let { form } = $props()

  let loading = $state(false)
  let password = $state('')
  let confirmPassword = $state('')
</script>

<svelte:head>
  <title>Register - Game Olympics</title>
</svelte:head>

{#if form?.success}
  <AuthCard title="Create account">
    <Alert
      type="default"
      message={`Account created. We sent a confirmation link to ${form.email}. Click it to activate your account, then sign in.`}
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
  <AuthCard
    title="Create account"
    description="Join Game Olympics to track sessions and standings."
  >
    <form
      class="space-y-4"
      method="POST"
      action="?/register"
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
      <div class="flex w-full flex-col gap-2">
        <Label for="playerName">Player Name</Label>
        <Input
          id="playerName"
          name="playerName"
          type="text"
          placeholder="Player Name"
          required
          disabled={loading}
        />
        {#if form?.errors?.playerName}
          <p class="text-sm text-destructive">{form.errors.playerName}</p>
        {/if}
      </div>
      <div class="flex w-full flex-col gap-2">
        <Label for="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          required
          disabled={loading}
        />
        {#if form?.errors?.email}
          <p class="text-sm text-destructive">{form.errors.email}</p>
        {/if}
      </div>
      <div class="flex w-full flex-col gap-2">
        <Label for="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          required
          disabled={loading}
          bind:value={password}
        />
        {#if form?.errors?.password}
          <p class="text-sm text-destructive">{form.errors.password}</p>
        {/if}
        <PasswordRules {password} {confirmPassword} />
      </div>
      <div class="flex w-full flex-col gap-2">
        <Label for="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="••••••••"
          required
          disabled={loading}
          bind:value={confirmPassword}
        />
        {#if form?.errors?.confirmPassword}
          <p class="text-sm text-destructive">{form.errors.confirmPassword}</p>
        {/if}
      </div>
      <Button type="submit" disabled={loading} class="w-full">
        {#if loading}
          <Spinner />
        {/if}
        Sign Up
      </Button>
    </form>
    {#snippet footer()}
      <p class="text-center text-muted-foreground">
        Already have an account?
        <a href={resolve('/auth/signin')} class="font-medium text-primary hover:underline"
          >Sign in</a
        >
      </p>
    {/snippet}
  </AuthCard>
{/if}
