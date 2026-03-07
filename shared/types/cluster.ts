export interface ClusterConfig {
  name: string
  server: string
  token: string
  certificate: string
  insecureSkipTlsVerify: boolean
  allowWrite: boolean
  allowPodDelete: boolean
  editableKinds: EditableKind[]
}

export interface Cluster {
  name: string
  server: string
  insecureSkipTlsVerify: boolean
  allowWrite: boolean
  allowPodDelete: boolean
  editableKinds: EditableKind[]
}

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

export const EDITABLE_KINDS = [
  'Pod',
  'Deployment',
  'StatefulSet',
  'DaemonSet',
  'Service',
  'ConfigMap',
  'Node',
] as const

export type EditableKind = (typeof EDITABLE_KINDS)[number]