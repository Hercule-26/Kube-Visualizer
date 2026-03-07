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