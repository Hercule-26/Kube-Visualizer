import * as k8s from '@kubernetes/client-node'

import type {
  ClusterActivity,
  ClusterActivityType,
  ClusterConfig,
  PodPhase,
} from '~~/shared/types/cluster'
import { createKubernetesClient, getClusterState, toPodPhase } from '~~/server/utils/kubernetes'

type SocketPeer = {
  id: string
  send: (message: string) => void
}

interface ClusterWatcher {
  config: ClusterConfig
  peers: Set<SocketPeer>
  podController: AbortController | null
  nodeController: AbortController | null
  updateTimer: ReturnType<typeof setTimeout> | null
  reconnectTimer: ReturnType<typeof setTimeout> | null
  starting: boolean
  refreshing: boolean
  pending: boolean
  silentUntil: number
  podRestarts: Map<string, number>
  podPhases: Map<string, PodPhase>
  nodeReady: Map<string, boolean>
}

const watchers = new Map<string, ClusterWatcher>()
const peerClusters = new Map<string, string>()

function sendState(peer: SocketPeer, state: unknown): void {
  peer.send(JSON.stringify({ type: 'cluster.state', data: state }))
}

function sendError(peer: SocketPeer, message: string): void {
  peer.send(JSON.stringify({ type: 'cluster.error', message }))
}

type ActivityPayload = Omit<ClusterActivity, 'id' | 'timestamp'>

function sendActivity(
  watcher: ClusterWatcher,
  activity: ActivityPayload,
): void {
  const data = JSON.stringify({
    type: 'cluster.activity',
    data: activity,
  })

  for (const peer of watcher.peers) {
    peer.send(data)
  }
}

function podActivity(watcher: ClusterWatcher, phase: string, pod: any): void {
  const name = pod?.metadata?.name ?? 'unknown'
  const namespace = pod?.metadata?.namespace ?? 'default'
  const uid = pod?.metadata?.uid ?? `${namespace}/${name}`
  const resource = `Pod/${namespace}/${name}`
  const statuses = pod?.status?.containerStatuses ?? []
  const restarts = statuses.reduce(
    (total: number, status: any) => total + (status.restartCount ?? 0),
    0,
  )
  const previousRestarts = watcher.podRestarts.get(uid) ?? restarts
  watcher.podRestarts.set(uid, restarts)

  const podPhase = toPodPhase(pod)
  const previousPhase = watcher.podPhases.get(uid)
  watcher.podPhases.set(uid, podPhase)

  if (Date.now() < watcher.silentUntil) {
    return
  }

  if (phase === 'ADDED') {
    sendActivity(watcher, {
      type: 'success',
      event: 'created',
      message: `Pod ${namespace}/${name} created`,
      resource,
    })
    return
  }

  if (phase === 'DELETED') {
    watcher.podRestarts.delete(uid)
    watcher.podPhases.delete(uid)

    sendActivity(watcher, {
      type: 'warning',
      event: 'deleted',
      message: `Pod ${namespace}/${name} deleted`,
      resource,
    })
    return
  }

  if (restarts > previousRestarts) {
    sendActivity(watcher, {
      type: 'warning',
      event: 'restarted',
      message: `Pod ${namespace}/${name} restarted`,
      resource,
    })
    return
  }

  if (previousPhase && previousPhase !== podPhase) {
    sendActivity(watcher, {
      type: phaseActivityType(podPhase),
      event: 'phase',
      message: `Pod ${namespace}/${name} is now ${podPhase}`,
      resource,
      phase: podPhase,
    })
  }
}

function phaseActivityType(phase: PodPhase): ClusterActivityType {
  if (phase === 'Failed' || phase === 'CrashLoopBackOff') {
    return 'error'
  }

  if (phase === 'Terminating') {
    return 'warning'
  }

  if (phase === 'Running' || phase === 'Succeeded') {
    return 'success'
  }

  return 'info'
}

function nodeActivity(watcher: ClusterWatcher, phase: string, node: any): void {
  const name = node?.metadata?.name ?? 'unknown'
  const resource = `Node/${name}`

  if (phase === 'DELETED') {
    watcher.nodeReady.delete(name)

    if (Date.now() < watcher.silentUntil) {
      return
    }

    sendActivity(watcher, {
      type: 'warning',
      event: 'deleted',
      message: `Node ${name} deleted`,
      resource,
    })
    return
  }

  const ready = Boolean(
    node?.status?.conditions?.some(
      (condition: any) => condition.type === 'Ready' && condition.status === 'True',
    ),
  )
  const previousReady = watcher.nodeReady.get(name)
  watcher.nodeReady.set(name, ready)

  if (Date.now() < watcher.silentUntil) {
    return
  }

  if (phase === 'ADDED') {
    sendActivity(watcher, {
      type: 'success',
      event: 'created',
      message: `Node ${name} added`,
      resource,
    })
    return
  }

  if (previousReady === undefined || previousReady === ready) {
    return
  }

  sendActivity(watcher, {
    type: ready ? 'success' : 'error',
    event: ready ? 'ready' : 'not-ready',
    message: `Node ${name} is ${ready ? 'ready' : 'not ready'}`,
    resource,
  })
}

async function refresh(clusterId: string): Promise<void> {
  const watcher = watchers.get(clusterId)

  if (!watcher) {
    return
  }

  if (watcher.refreshing) {
    watcher.pending = true
    return
  }

  watcher.refreshing = true

  try {
    const state = await getClusterState(watcher.config)

    for (const peer of watcher.peers) {
      sendState(peer, state)
    }
  }
  catch {
    for (const peer of watcher.peers) {
      sendError(peer, 'Unable to retrieve cluster information.')
    }
  }
  finally {
    watcher.refreshing = false

    if (watcher.pending) {
      watcher.pending = false
      void refresh(clusterId)
    }
  }
}

function scheduleRefresh(clusterId: string): void {
  const watcher = watchers.get(clusterId)

  if (!watcher || watcher.updateTimer) {
    return
  }

  watcher.updateTimer = setTimeout(() => {
    const currentWatcher = watchers.get(clusterId)

    if (currentWatcher) {
      currentWatcher.updateTimer = null
    }

    void refresh(clusterId)
  }, 250)
}

function scheduleReconnect(clusterId: string): void {
  const watcher = watchers.get(clusterId)

  if (!watcher || watcher.peers.size === 0 || watcher.reconnectTimer) {
    return
  }

  watcher.reconnectTimer = setTimeout(() => {
    const currentWatcher = watchers.get(clusterId)

    if (!currentWatcher) {
      return
    }

    currentWatcher.reconnectTimer = null
    void start(clusterId)
  }, 2000)
}

function watchEnded(clusterId: string): void {
  const watcher = watchers.get(clusterId)

  if (!watcher) {
    return
  }

  watcher.podController?.abort()
  watcher.nodeController?.abort()
  watcher.podController = null
  watcher.nodeController = null
  scheduleReconnect(clusterId)
}

async function start(clusterId: string): Promise<void> {
  const watcher = watchers.get(clusterId)

  if (!watcher || watcher.peers.size === 0 || watcher.starting || watcher.podController || watcher.nodeController) {
    return
  }

  watcher.starting = true
  watcher.silentUntil = Date.now() + 1500

  const client = createKubernetesClient(watcher.config)
  const watch = new k8s.Watch(client)

  try {
    const [podController, nodeController] = await Promise.all([
      watch.watch('/api/v1/pods', {}, (phase, pod) => {
        if (phase !== 'BOOKMARK') {
          const currentWatcher = watchers.get(clusterId)

          if (currentWatcher) {
            podActivity(currentWatcher, phase, pod)
          }

          scheduleRefresh(clusterId)
        }
      }, () => watchEnded(clusterId)),
      watch.watch('/api/v1/nodes', {}, (phase, node) => {
        if (phase !== 'BOOKMARK') {
          const currentWatcher = watchers.get(clusterId)

          if (currentWatcher) {
            nodeActivity(currentWatcher, phase, node)
          }

          scheduleRefresh(clusterId)
        }
      }, () => watchEnded(clusterId)),
    ])

    const currentWatcher = watchers.get(clusterId)

    if (!currentWatcher || currentWatcher.peers.size === 0) {
      podController.abort()
      nodeController.abort()
      return
    }

    currentWatcher.starting = false
    currentWatcher.podController = podController
    currentWatcher.nodeController = nodeController
  }
  catch {
    const currentWatcher = watchers.get(clusterId)

    if (currentWatcher) {
      currentWatcher.starting = false
    }

    scheduleReconnect(clusterId)
  }
}

function stop(clusterId: string): void {
  const watcher = watchers.get(clusterId)

  if (!watcher) {
    return
  }

  watcher.podController?.abort()
  watcher.nodeController?.abort()

  if (watcher.updateTimer) {
    clearTimeout(watcher.updateTimer)
  }

  if (watcher.reconnectTimer) {
    clearTimeout(watcher.reconnectTimer)
  }

  watchers.delete(clusterId)
}

export async function subscribeToCluster(
  peer: SocketPeer,
  config: ClusterConfig,
): Promise<void> {
  unsubscribeFromCluster(peer)

  let watcher = watchers.get(config.id)

  if (!watcher) {
    watcher = {
      config,
      peers: new Set(),
      podController: null,
      nodeController: null,
      updateTimer: null,
      reconnectTimer: null,
      starting: false,
      refreshing: false,
      pending: false,
      silentUntil: Date.now() + 1500,
      podRestarts: new Map(),
      podPhases: new Map(),
      nodeReady: new Map(),
    }
    watchers.set(config.id, watcher)
  }

  watcher.peers.add(peer)
  peerClusters.set(peer.id, config.id)

  try {
    sendState(peer, await getClusterState(config))
  }
  catch {
    sendError(peer, 'Unable to retrieve cluster information.')
  }

  void start(config.id)
}

export function unsubscribeFromCluster(peer: SocketPeer): void {
  const clusterId = peerClusters.get(peer.id)

  if (!clusterId) {
    return
  }

  peerClusters.delete(peer.id)

  const watcher = watchers.get(clusterId)

  if (!watcher) {
    return
  }

  watcher.peers.delete(peer)

  if (watcher.peers.size === 0) {
    stop(clusterId)
  }
}
