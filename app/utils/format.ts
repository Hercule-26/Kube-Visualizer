import type { PodPhase } from '#shared/types/cluster'

export const POD_STATES = [
  {
    phase: 'Running',
    label: 'Running',
    hint: 'ready, serving traffic',
    color: 'bg-emerald-500'
  },
  {
    phase: 'Pending',
    label: 'Pending / not ready',
    hint: 'scheduling or starting',
    color: 'bg-amber-500'
  },
  {
    phase: 'CrashLoopBackOff',
    label: 'Crash / failed',
    hint: 'restarting in back-off',
    color: 'bg-red-500'
  },
  {
    phase: 'Failed',
    label: 'Failed',
    hint: 'pod failed',
    color: 'bg-red-500'
  },
  {
    phase: 'Terminating',
    label: 'Terminating',
    hint: 'being removed',
    color: 'bg-purple-500'
  },
  {
    phase: 'Succeeded',
    label: 'Succeeded',
    hint: 'completed job',
    color: 'bg-blue-500'
  }
] satisfies {
  phase: PodPhase
  label: string
  hint: string
  color: string
}[]

export function getPodState(phase: PodPhase) {
  return POD_STATES.find(
    state => state.phase === phase
  )
}

export function getPodStateColor(phase: PodPhase) {
  return getPodState(phase)?.color ?? 'bg-gray-500'
}

export function getActivityColor(
  type: 'info' | 'success' | 'warning' | 'error'
): string {
  switch (type) {
    case 'error':
      return 'bg-error'
    case 'warning':
      return 'bg-warning'
    case 'success':
      return 'bg-success'
    case 'info':
    default:
      return 'bg-info'
  }
}

export function formatActivityTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

export function formatRelativeTime(
  timestamp: string,
  referenceMs: number = Date.now()
): string {
  const date = new Date(timestamp)

  if (Number.isNaN(date.getTime())) {
    return timestamp
  }

  const diffSeconds = Math.max(
    0,
    Math.round((referenceMs - date.getTime()) / 1000)
  )

  if (diffSeconds < 5) {
    return 'now'
  }

  if (diffSeconds < 60) {
    return `${diffSeconds}s`
  }

  const diffMinutes = Math.round(diffSeconds / 60)

  if (diffMinutes < 60) {
    return `${diffMinutes}m`
  }

  const diffHours = Math.round(diffMinutes / 60)

  if (diffHours < 24) {
    return `${diffHours}h`
  }

  const diffDays = Math.round(diffHours / 24)

  return `${diffDays}d`
}

export function formatDate(value: string): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('fr-BE', {
    dateStyle: 'short',
    timeStyle: 'medium'
  }).format(date)
}