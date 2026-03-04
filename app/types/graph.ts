import type { PodPhase } from '#shared/types/cluster'

export type LayoutMode = 'flow' | 'nodes' | 'namespaces'

export type EntityKind = 'workload' | 'service' | 'internet'

/** A pod drawn inside a card, with its position relative to the card. */
export interface PodSlot {
  uid: string
  name: string
  phase: PodPhase
  ready: boolean
  restarts: number
  x: number
  y: number
}

/** Descriptor handed to the layout engine, before any position is computed. */
export interface CardInput {
  id: string
  entityId: string
  kind: EntityKind
  title: string
  subtitle: string
  namespace: string
  workloadKind?: string
  groupId?: string
  pods: Array<{ uid: string, name: string, phase: PodPhase, ready: boolean, restarts: number }>
  desired?: number
}

export interface GroupInput {
  id: string
  label: string
  sublabel?: string
  kind: 'node' | 'namespace'
}

export interface EdgeInput {
  id: string
  source: string
  target: string
}

export interface GraphCard extends CardInput {
  x: number
  y: number
  width: number
  height: number
  podSlots: PodSlot[]
}

export interface GraphGroup extends GroupInput {
  x: number
  y: number
  width: number
  height: number
}

export interface GraphEdge {
  id: string
  source: string
  target: string
  sourceCardId: string
  targetCardId: string
  path: string
  labelX: number
  labelY: number
}

export interface GraphLayout {
  mode: LayoutMode
  cards: GraphCard[]
  groups: GraphGroup[]
  edges: GraphEdge[]
  width: number
  height: number
  cardById: Map<string, GraphCard>
  cardIdByPod: Map<string, string>
  /** Absolute position of every pod, used to aim traffic animations. */
  podPositions: Map<string, { x: number, y: number }>
}
