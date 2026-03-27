import type {
  ClusterActivity,
  ClusterNode,
  Pod,
} from '#shared/types/cluster'

type SocketStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'

interface SocketState {
  status: SocketStatus
  socket: WebSocket | null
  reconnectTimer: ReturnType<typeof setTimeout> | null
  clusterFailed: boolean
}

interface SocketMessage {
  type: string
  data?: unknown
  message?: string
}


interface ClusterState {
  pods: Pod[]
  nodes: ClusterNode[]
  metricsAvailable: boolean
}

export function useWebSocket() {
  const socketState = useState<SocketState>('kube-websocket', () => ({
    status: 'disconnected',
    socket: null,
    reconnectTimer: null,
    clusterFailed: false,
  }))

  const clusterStore = useClusterStore()
  const toasts = useAppToast()

  const status = computed(
    () => socketState.value.status,
  )

  function connect(): void {
    if (!import.meta.client) {
      return
    }

    const currentSocket = socketState.value.socket

    if (
      currentSocket
      && (
        currentSocket.readyState === WebSocket.OPEN
        || currentSocket.readyState === WebSocket.CONNECTING
      )
    ) {
      return
    }

    socketState.value.status =
      socketState.value.status === 'disconnected'
        ? 'connecting'
        : 'reconnecting'

    const protocol =
      window.location.protocol === 'https:'
        ? 'wss:'
        : 'ws:'

    const ws = new WebSocket(
      `${protocol}//${window.location.host}/api/ws`,
    )

    socketState.value.socket = ws

    ws.onopen = () => {
      if (socketState.value.status === 'reconnecting') {
        toasts.ok(
          'Live updates restored',
          'The connection to the server is back.',
        )
      }

      socketState.value.status = 'connected'
      refresh()
    }

    ws.onmessage = event => {
      handleMessage(event.data)
    }

    ws.onerror = () => clusterStore.setClusterLoading(false)

    ws.onclose = () => {
      socketState.value.socket = null

      if (socketState.value.status === 'disconnected') {
        return
      }

      if (socketState.value.status === 'connected') {
        toasts.warn(
          'Live updates interrupted',
          'The connection to the server dropped. Trying to reconnect…',
        )
      }

      socketState.value.status = 'reconnecting'

      socketState.value.reconnectTimer = setTimeout(() => {
        connect()
      }, 2000)
    }
  }

  function disconnect(): void {
    const ws = socketState.value.socket

    if (!ws) {
      return
    }

    ws.onclose = null
    ws.close()

    if (socketState.value.reconnectTimer) {
      clearTimeout(socketState.value.reconnectTimer)
      socketState.value.reconnectTimer = null
    }

    socketState.value.socket = null
    socketState.value.status = 'disconnected'
  }

  function send(message: unknown): boolean {
    const ws = socketState.value.socket

    if (
      !ws
      || ws.readyState !== WebSocket.OPEN
    ) {
      return false
    }

    ws.send(JSON.stringify(message))

    return true
  }

  function refresh(): void {
    const clusterId = clusterStore.currentCluster?.id

    if (!clusterId) {
      return
    }

    const sent = send({
      type: 'cluster.select',
      clusterId,
    })

    if (sent) {
      clusterStore.setClusterLoading(true)
    }
  }

  function handleMessage(rawMessage: string): void {
    try {
      const message = JSON.parse(
        rawMessage,
      ) as SocketMessage

      switch (message.type) {
        case 'cluster.state':
          handleClusterState(message.data)
          break

        case 'cluster.error':
          handleClusterError(message.message)
          break

        case 'cluster.activity':
          handleClusterActivity(message.data)
          break

        default:
          console.warn(
            '[WebSocket] Unknown message:',
            message.type,
          )
      }
    }
    catch {
      console.warn(
        '[WebSocket] Invalid message:',
        rawMessage,
      )
    }
  }

  function handleClusterState(data: unknown): void {
    if (!data) {
      return
    }
    const state = data as ClusterState

    clusterStore.setPods(state.pods)
    clusterStore.setNodes(state.nodes)
    clusterStore.setMetricsAvailable(state.metricsAvailable)
    clusterStore.setClusterLoading(false)

    if (socketState.value.clusterFailed) {
      socketState.value.clusterFailed = false

      toasts.ok(
        'Cluster reachable again',
        'Cluster data is being received.',
      )
    }
  }

  function handleClusterError(message?: string): void {
    clusterStore.setClusterLoading(false)

    if (socketState.value.clusterFailed) {
      return
    }

    socketState.value.clusterFailed = true

    toasts.fail(
      'Cluster unreachable',
      message ?? 'The cluster could not be read.',
    )
  }

  function handleClusterActivity(data: unknown): void {
    const activity = data as Omit<ClusterActivity, 'id' | 'timestamp'>

    if (!activity?.type || !activity.message) {
      return
    }

    clusterStore.addActivity(activity)
  }

  return {
    status,
    connect,
    disconnect,
    send,
    refresh,
  }
}
