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

  const getVariant = (status: Database['public']['Enums']['Season Status']) => {
    switch (status) {
      case 'UPCOMING':
        return 'secondary'
      case 'IN_PROGRESS':
        return 'secondary'
      case 'SUSPENDED':
        return 'destructive'
      case 'COMPLETED':
        return 'default'
      default:
        return 'default'
    }
  }
</script>

<Badge variant={getVariant(seasonStatus)}>{statusLabels[seasonStatus] ?? 'Unknown'}</Badge>
