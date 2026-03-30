import * as k8s from '@kubernetes/client-node'
import type {
  ClusterConfig,
  Cluster,
  ClusterNode,
  ContainerState,
  Pod,
  PodPhase,
} from '~~/shared/types/cluster'

export interface ClusterState {
  cluster: Cluster
  nodes: ClusterNode[]
  pods: Pod[]
  metricsAvailable: boolean
}

const BROKEN_WAITING_REASONS = [
  'ImagePullBackOff',
  'ErrImagePull',
  'InvalidImageName',
  'CreateContainerConfigError',
  'CreateContainerError',
  'RunContainerError',
]

function waitingReasons(pod: k8s.V1Pod): string[] {
  const statuses = [
    ...(pod.status?.initContainerStatuses ?? []),
    ...(pod.status?.containerStatuses ?? []),
  ]

  return statuses
    .map(status => status.state?.waiting?.reason)
    .filter((reason): reason is string => Boolean(reason))
}

export function toPodPhase(pod: k8s.V1Pod): PodPhase {
  if (pod.metadata?.deletionTimestamp) {
    return 'Terminating'
  }

  const reasons = waitingReasons(pod)

  if (reasons.includes('CrashLoopBackOff')) {
    return 'CrashLoopBackOff'
  }

  if (reasons.some(reason => BROKEN_WAITING_REASONS.includes(reason))) {
    return 'Failed'
  }

  const phase = pod.status?.phase

  if (!phase) {
    return 'Unknown'
  }

  if (phase === 'Running' || phase === 'Pending' || phase === 'Succeeded' || phase === 'Failed') {
    return phase
  }

  return 'Unknown'
}

function toContainerState(status?: k8s.V1ContainerStatus): ContainerState {
  if (status?.state?.running) {
    return 'running'
  }

  if (status?.state?.waiting) {
    return 'waiting'
  }

  if (status?.state?.terminated) {
    return 'terminated'
  }

  return 'unknown'
}

export function toWorkload(
  pod: k8s.V1Pod,
  replicaSetOwners: Map<string, string>,
): string | null {
  const owner = pod.metadata?.ownerReferences?.find(item => item.controller)
    ?? pod.metadata?.ownerReferences?.[0]

  if (!owner) {
    return null
  }

  if (owner.kind === 'ReplicaSet') {
    const namespace = pod.metadata?.namespace ?? ''
    const deployment = replicaSetOwners.get(`${namespace}/${owner.name}`)
      ?? owner.name.replace(/-[a-z0-9]{6,10}$/, '')

    return `Deployment/${deployment}`
  }

  return `${owner.kind}/${owner.name}`
}

export async function getReplicaSetOwners(
  kubeConfig: k8s.KubeConfig,
): Promise<Map<string, string>> {
  const owners = new Map<string, string>()

  try {
    const appsApi = kubeConfig.makeApiClient(k8s.AppsV1Api)
    const replicaSets = await appsApi.listReplicaSetForAllNamespaces()

    for (const replicaSet of replicaSets.items) {
      const owner = replicaSet.metadata?.ownerReferences?.find(
        item => item.kind === 'Deployment',
      )

      if (replicaSet.metadata?.name && replicaSet.metadata.namespace && owner) {
        owners.set(
          `${replicaSet.metadata.namespace}/${replicaSet.metadata.name}`,
          owner.name,
        )
      }
    }
  }
  catch {
    return owners
  }

  return owners
}

function toPod(pod: k8s.V1Pod, replicaSetOwners: Map<string, string>): Pod {
  const statuses = pod.status?.containerStatuses ?? []
  const phase = toPodPhase(pod)

  const isReady = pod.status?.conditions?.some(
    condition => condition.type === 'Ready' && condition.status === 'True',
  ) ?? false

  const containers = (pod.spec?.containers ?? []).map((container) => {
    const status = statuses.find(item => item.name === container.name)

    return {
      name: container.name,
      image: container.image ?? status?.image ?? '',
      state: toContainerState(status),
      ready: status?.ready ?? false,
      restarts: status?.restartCount ?? 0,
    }
  })

  return {
    containers,
    uid: pod.metadata?.uid ?? '',
    name: pod.metadata?.name ?? '',
    namespace: pod.metadata?.namespace ?? '',
    phase,
    ready: phase === 'Running' && isReady,
    node: pod.spec?.nodeName ?? null,
    workload: toWorkload(pod, replicaSetOwners),
    restarts: statuses.reduce(
      (total, status) => total + status.restartCount,
      0,
    ),
    createdAt: pod.metadata?.creationTimestamp?.toString() ?? '',
    startedAt: pod.status?.startTime?.toString() ?? null,
  }
}

export function toManifest(resource: Record<string, any>): Record<string, any> {
  const metadata = { ...resource.metadata }

  delete metadata.managedFields

  return JSON.parse(JSON.stringify({ ...resource, metadata }))
}

export function createKubernetesClient(
  config: ClusterConfig,
): k8s.KubeConfig {
  const kubeConfig = new k8s.KubeConfig()

  kubeConfig.loadFromOptions({
    clusters: [
      {
        name: config.name,
        server: config.server,
        caData: config.insecureSkipTlsVerify
          ? undefined
          : config.certificate,
        skipTLSVerify: config.insecureSkipTlsVerify,
      },
    ],

    users: [
      {
        name: config.name,
        token: config.token,
      },
    ],

    contexts: [
      {
        name: config.name,
        cluster: config.name,
        user: config.name,
      },
    ],

    currentContext: config.name,
  })

  return kubeConfig
}

async function hasMetricsApi(kubeConfig: k8s.KubeConfig): Promise<boolean> {
  try {
    const apisApi = kubeConfig.makeApiClient(k8s.ApisApi)
    const groups = await apisApi.getAPIVersions()

    return (groups.groups ?? []).some(
      group => group.name === 'metrics.k8s.io',
    )
  }
  catch {
    return false
  }
}

export async function getClusterState(
  config: ClusterConfig,
): Promise<ClusterState> {
  const kubeConfig = createKubernetesClient(config)

  const coreApi = kubeConfig.makeApiClient(
    k8s.CoreV1Api,
  )

  const nodesRequest = coreApi.listNode()
  const podsRequest = coreApi.listPodForAllNamespaces()
  const ownersRequest = getReplicaSetOwners(kubeConfig)
  const metricsRequest = hasMetricsApi(kubeConfig)

  const [nodesResult, podsResult] = await Promise.allSettled([
    nodesRequest,
    podsRequest,
  ])

  const replicaSetOwners = await ownersRequest
  const metricsAvailable = await metricsRequest

  if (nodesResult.status === 'rejected') {
    throw nodesResult.reason
  }

  if (podsResult.status === 'rejected') {
    throw podsResult.reason
  }

  const nodes = nodesResult.value
  const pods = podsResult.value

  return {
    cluster: {
      id: config.id,
      name: config.name,
      server: config.server,
      insecureSkipTlsVerify: config.insecureSkipTlsVerify,
    },

    nodes: nodes.items.map(node => ({
      name: node.metadata?.name ?? '',
    })),

    pods: pods.items.map(pod => toPod(pod, replicaSetOwners)),

    metricsAvailable,
  }
}

export async function testClusterConnection(
  config: ClusterConfig,
): Promise<void> {
  const kubeConfig = createKubernetesClient(config)

  const coreApi = kubeConfig.makeApiClient(
    k8s.CoreV1Api,
  )

  await coreApi.listNamespace()
}

export function kubernetesErrorMessage(
  error: unknown,
): string {
  if (!(error instanceof Error)) {
    return 'Unable to connect to the Kubernetes cluster.'
  }

  const message = error.message

  if (
    message.includes('ECONNREFUSED')
    || message.includes('ENOTFOUND')
    || message.includes('EAI_AGAIN')
    || message.includes('fetch failed')
  ) {
    return 'Unable to reach the Kubernetes API server. Check the server URL and network connection.'
  }

  if (
    message.includes('certificate')
    || message.includes('CERT_')
    || message.includes('self-signed')
    || message.includes('TLS')
  ) {
    return 'TLS certificate verification failed. Check the cluster CA certificate or disable certificate verification.'
  }

  if (
    message.includes('401')
    || message.includes('Unauthorized')
    || message.includes('Invalid token')
  ) {
    return 'The ServiceAccount token is invalid or has expired.'
  }

  if (
    message.includes('403')
    || message.includes('Forbidden')
  ) {
    return 'The ServiceAccount does not have permission to access this cluster.'
  }

  return message
}
