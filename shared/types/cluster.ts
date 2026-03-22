export interface ClusterConfig {
  id: string
  name: string
  server: string
  token: string
  certificate: string
  insecureSkipTlsVerify: boolean
}

export interface Cluster {
  id: string
  name: string
  server: string
  insecureSkipTlsVerify: boolean
}

export type PodPhase =
  | 'Pending'
  | 'Running'
  | 'Succeeded'
  | 'Failed'
  | 'Unknown'
  | 'Terminating'
  | 'CrashLoopBackOff'

export type ContainerState =
  | 'running'
  | 'waiting'
  | 'terminated'
  | 'unknown'

export interface PodContainer {
  name: string
  image: string
  state: ContainerState
  ready: boolean
  restarts: number
}

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
  containers: PodContainer[]
}

export interface ClusterNode {
  name: string
}

export type ClusterActivityType =
  | 'info'
  | 'success'
  | 'warning'
  | 'error'

export type ClusterActivityEvent =
  | 'created'
  | 'deleted'
  | 'restarted'
  | 'phase'
  | 'ready'
  | 'not-ready'

export interface ClusterActivity {
  id: string
  timestamp: string
  type: ClusterActivityType
  event: ClusterActivityEvent
  message: string
  resource?: string
  phase?: PodPhase
}

export interface PodDetails {
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
  ip: string | null
  serviceAccount: string | null
  labels: Record<string, string>
  annotations: Record<string, string>
  containers: PodContainerDetails[]
  conditions: PodCondition[]
  qosClass: string | null
}

export interface PodContainerDetails {
  name: string
  image: string
  ready: boolean
  restartCount: number
  state: string
  reason: string | null
}

export interface PodCondition {
  type: string
  status: string
  reason: string | null
  message: string | null
}