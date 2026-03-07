export type PodPhase =
  | 'Pending'
  | 'Running'
  | 'Succeeded'
  | 'Failed'
  | 'Unknown'
  | 'Terminating'
  | 'CrashLoopBackOff'

export interface Pod {
  uid: string
  name: string
  namespace: string

  phase: PodPhase
  ready: boolean

  node: string | null
  workload: string | null

  restarts: number

  createdAt: string
  startedAt: string | null
}

export interface ClusterNode {
  name: string
}