<script lang="ts">
  import { Button } from '$lib/components/ui/button'
  import { Label } from '$lib/components/ui/label'
  import { Input } from '$lib/components/ui/input'
  import { Spinner } from '$lib/components/ui/spinner'
  import Alert from '$lib/components/Alert.svelte'
  import { applyAction, enhance } from '$app/forms'

  let { form } = $props()

  let loading = $state(false)
</script>

<svelte:head>
  <title>Forgot Password - Game Olympics</title>
</svelte:head>

<div
  class="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800"
>
  <div class="w-full max-w-md">
    <div class="rounded-lg bg-white p-8 shadow-xl">
      <h1 class="mb-8 text-center text-3xl font-bold text-slate-900">Reset Password</h1>

      {#if form?.success}
        <Alert
          type="default"
          message="If an account exists with that email, you will receive a password reset link shortly."
        />
        <p class="mt-6 text-center text-sm text-slate-600">
          <a href="/auth/signin" class="font-medium text-blue-600 hover:text-blue-700">
            Back to Sign In
          </a>
        </p>
      {:else}
        <form
          class="space-y-4"
          method="POST"
          action="?/forgot"
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

          <Button type="submit" disabled={loading} class="w-full">
            {#if loading}
              <Spinner />
            {/if}
            Send Reset Link
          </Button>
        </form>

        <p class="mt-6 text-center text-sm text-slate-600">
          <a href="/auth/signin" class="font-medium text-blue-600 hover:text-blue-700">
            Back to Sign In
          </a>
        </p>
      {/if}
    </div>
  </div>
</div>
