<script lang="ts">
  import { enhance, applyAction } from '$app/forms'
  import { goto } from '$app/navigation'
  import { Button } from '$lib/components/ui/button'
  import { Input } from '$lib/components/ui/input'
  import Label from '$lib/components/ui/label/label.svelte'
  import { Spinner } from '$lib/components/ui/spinner'

  let { form } = $props()

  let loading = $state(false)
</script>

<svelte:head>
  <title>Register - Game Olympics</title>
</svelte:head>

<div
  class="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800"
>
  <div class="w-full max-w-md">
    <div class="rounded-lg bg-white p-8 shadow-xl">
      <h1 class="mb-8 text-center text-3xl font-bold text-slate-900">Create Account</h1>
      <form
        class="space-y-4"
        method="POST"
        action="?/register"
        use:enhance={() => {
          loading = true
          return async ({ result }) => {
            loading = false
            applyAction(result)
          }
        }}
      >
        <div class="flex w-full max-w-sm flex-col gap-1.5">
          <Label for="playerName">Player Name</Label>
          <Input name="playerName" type="text" placeholder="Player Name" required />
          {#if form?.errors?.playerName}
            <p class="text-sm text-red-600">{form.errors.playerName}</p>
          {/if}
        </div>
        <div class="flex w-full max-w-sm flex-col gap-1.5">
          <Label for="email">Email</Label>
          <Input name="email" type="email" placeholder="Email" required />
          {#if form?.errors?.email}
            <p class="text-sm text-red-600">{form.errors.email}</p>
          {/if}
        </div>
        <div class="flex w-full max-w-sm flex-col gap-1.5">
          <Label for="password">Password</Label>
          <Input name="password" type="password" placeholder="Password" required />
          {#if form?.errors?.password}
            <p class="text-sm text-red-600">{form.errors.password}</p>
          {/if}
        </div>
        <div class="flex w-full max-w-sm flex-col gap-1.5">
          <Label for="confirmPassword">Confirm Password</Label>
          <Input name="confirmPassword" type="password" placeholder="Confirm Password" required />
          {#if form?.errors?.confirmPassword}
            <p class="text-sm text-red-600">{form.errors.confirmPassword}</p>
          {/if}
        </div>
        <Button type="submit" disabled={loading}>
          {#if loading}
            <Spinner />
          {/if}
          Sign Up
        </Button>
      </form>
    </div>
  </div>
</div>
