type SocketStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'

interface SocketState {
  status: SocketStatus
  socket: WebSocket | null
}

interface SocketMessage {
  type: string
  data?: unknown
  message?: string
}

export function useWebSocket() {
  const socketState = useState<SocketState>('kube-websocket', () => ({
    status: 'disconnected',
    socket: null,
  }))

  const clusterStore = useClusterStore()

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
      socketState.value.status = 'connected'

      console.log('[WebSocket] Connected')

      sendCurrentCluster()
    }

    ws.onmessage = (event) => {
      handleMessage(event.data)
    }

    ws.onerror = () => {
      console.warn('[WebSocket] Connection error')
    }

    ws.onclose = () => {
      socketState.value.socket = null

      if (socketState.value.status === 'disconnected') {
        return
      }

      socketState.value.status = 'reconnecting'

      console.log('[WebSocket] Disconnected')

      setTimeout(() => {
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

  function sendCurrentCluster(): void {
    const clusterId = clusterStore.currentCluster?.id

    if (!clusterId) {
      return
    }

    clusterStore.setClusterLoading(true)

    send({
      type: 'cluster.select',
      clusterId,
    })
  }

  function handleMessage(rawMessage: string): void {
    try {
      const message = JSON.parse(
        rawMessage,
      ) as SocketMessage

      console.log('[WebSocket] Message:', message)

      switch (message.type) {
        case 'cluster.pods':
          handleClusterPods(message.data)
          break

        case 'cluster.nodes':
          handleClusterNodes(message.data)
          break

        case 'cluster.ready':
          handleClusterReady()
          break

        case 'cluster.error':
          handleClusterError(message.message)
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

  function handleClusterPods(data: unknown): void {
    if (!Array.isArray(data)) {
      return
    }

    clusterStore.setPods(data)
  }

  function handleClusterNodes(data: unknown): void {
    if (!Array.isArray(data)) {
      return
    }

    clusterStore.setNodes(data)
  }

  function handleClusterReady(): void {
    clusterStore.setClusterLoading(false)

    console.log(
      '[Cluster] Ready:',
      clusterStore.currentCluster?.name,
    )
  }

  function handleClusterError(message?: string): void {
    clusterStore.setClusterLoading(false)

    console.error(
      '[Cluster] Error:',
      message ?? 'Unknown cluster error',
    )
  }

  watch(() => clusterStore.currentCluster?.id, (clusterId, previousId) => {
    if (!clusterId || clusterId === previousId) {
      return
    }
    sendCurrentCluster()
  })

  return {
    status,
    connect,
    disconnect,
  }
}