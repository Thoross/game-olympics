<script lang="ts">
  import type { Database } from '$lib/database.types'
  import Badge from './ui/badge/badge.svelte'

  let { seasonStatus }: { seasonStatus: Database['public']['Enums']['Season Status'] } = $props()

  const statusLabels = {
    UPCOMING: 'Upcoming',
    IN_PROGRESS: 'In Progress',
    SUSPENDED: 'Suspended',
    COMPLETED: 'Completed',
  }

  const statusClasses: Record<Database['public']['Enums']['Season Status'], string> = {
    UPCOMING:
      'border-blue-500/20 bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
    IN_PROGRESS:
      'border-green-500/20 bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400',
    SUSPENDED:
      'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400',
    COMPLETED: 'border-border bg-muted text-muted-foreground dark:bg-muted/50',
  }
</script>

<Badge variant="outline" class={statusClasses[seasonStatus]}>
  {statusLabels[seasonStatus] ?? 'Unknown'}
</Badge>
