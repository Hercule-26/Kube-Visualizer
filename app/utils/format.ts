import type { Pod, PodPhase } from '#shared/types/cluster'

export const POD_STATES = [
  {
    phase: 'Running',
    label: 'Running',
    hint: 'ready, serving traffic',
    color: 'bg-[var(--status-running)]',
    softColor: 'bg-[var(--status-running)]/12',
    textColor: 'text-[var(--status-running)]'
  },
  {
    phase: 'Pending',
    label: 'Pending / not ready',
    hint: 'scheduling or starting',
    color: 'bg-[var(--status-pending)]',
    softColor: 'bg-[var(--status-pending)]/12',
    textColor: 'text-[var(--status-pending)]'
  },
  {
    phase: 'CrashLoopBackOff',
    label: 'CrashLoopBackOff',
    hint: 'restarting in back-off',
    color: 'bg-[var(--status-failed)]',
    softColor: 'bg-[var(--status-failed)]/12',
    textColor: 'text-[var(--status-failed)]'
  },
  {
    phase: 'Failed',
    label: 'Failed',
    hint: 'container error',
    color: 'bg-[var(--status-failed)]',
    softColor: 'bg-[var(--status-failed)]/12',
    textColor: 'text-[var(--status-failed)]'
  },
  {
    phase: 'Terminating',
    label: 'Terminating',
    hint: 'being removed',
    color: 'bg-[var(--status-terminating)]',
    softColor: 'bg-[var(--status-terminating)]/12',
    textColor: 'text-[var(--status-terminating)]'
  },
  {
    phase: 'Succeeded',
    label: 'Succeeded',
    hint: 'completed job',
    color: 'bg-[var(--status-succeeded)]',
    softColor: 'bg-[var(--status-succeeded)]/12',
    textColor: 'text-[var(--status-succeeded)]'
  },
  {
    phase: 'Unknown',
    label: 'Unknown',
    hint: 'node unreachable',
    color: 'bg-[var(--status-unknown)]',
    softColor: 'bg-[var(--status-unknown)]/12',
    textColor: 'text-[var(--status-unknown)]'
  }
] satisfies {
  phase: PodPhase
  label: string
  hint: string
  color: string
  softColor: string
  textColor: string
}[]

export const POD_PHASES = POD_STATES.map(state => state.phase)

const UNKNOWN_STATE = POD_STATES[POD_STATES.length - 1]!

export function getPodState(phase: PodPhase) {
  return POD_STATES.find(
    state => state.phase === phase
  ) ?? UNKNOWN_STATE
}

export function getPodStateColor(phase: PodPhase, ready = true): string {
  if (phase === 'Running' && !ready) {
    return 'bg-[var(--status-pending)]'
  }

  return getPodState(phase).color
}

export function getPodStateLabel(phase: PodPhase, ready = true): string {
  if (phase === 'Running' && !ready) {
    return 'Not ready'
  }

  return phase
}

const WORKLOAD_KINDS: Record<string, string> = {
  ReplicaSet: 'deploy',
  Deployment: 'deploy',
  DaemonSet: 'ds',
  StatefulSet: 'sts',
  Job: 'job',
  CronJob: 'cron',
  Node: 'pod'
}

export function getWorkloadKey(pod: Pod): string {
  return `${pod.namespace}/${pod.workload ?? pod.name}`
}

export function getWorkloadName(pod: Pod): string {
  if (!pod.workload) {
    return pod.name
  }

  return pod.workload.split('/')[1] ?? pod.name
}

export function getWorkloadKind(workload: string | null): string {
  if (!workload) {
    return 'pod'
  }

  const kind = workload.split('/')[0] ?? 'pod'

  return WORKLOAD_KINDS[kind] ?? kind.toLowerCase()
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