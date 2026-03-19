import * as k8s from '@kubernetes/client-node'
import type {
  ClusterConfig,
  Cluster,
  ClusterNode,
  Pod,
  PodPhase,
} from '~~/shared/types/cluster'

export interface ClusterState {
  cluster: Cluster
  nodes: ClusterNode[]
  pods: Pod[]
}

function toPodPhase(pod: k8s.V1Pod): PodPhase {
  const crashLoop = pod.status?.containerStatuses?.some(
    status => status.state?.waiting?.reason === 'CrashLoopBackOff',
  )

  if (crashLoop) {
    return 'CrashLoopBackOff'
  }

  return (pod.status?.phase ?? 'Unknown') as PodPhase
}

function toPod(pod: k8s.V1Pod): Pod {
  const statuses = pod.status?.containerStatuses ?? []
  const owner = pod.metadata?.ownerReferences?.[0]

  return {
    uid: pod.metadata?.uid ?? '',
    name: pod.metadata?.name ?? '',
    namespace: pod.metadata?.namespace ?? '',
    phase: toPodPhase(pod),
    ready: pod.status?.conditions?.some(
      condition => condition.type === 'Ready' && condition.status === 'True',
    ) ?? false,
    node: pod.spec?.nodeName ?? null,
    workload: owner ? `${owner.kind}/${owner.name}` : null,
    restarts: statuses.reduce(
      (total, status) => total + status.restartCount,
      0,
    ),
    createdAt: pod.metadata?.creationTimestamp?.toString() ?? '',
    startedAt: pod.status?.startTime?.toString() ?? null,
  }
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

export async function getClusterState(
  config: ClusterConfig,
): Promise<ClusterState> {
  const kubeConfig = createKubernetesClient(config)

  const coreApi = kubeConfig.makeApiClient(
    k8s.CoreV1Api,
  )

  const [nodes, pods] = await Promise.all([
    coreApi.listNode(),
    coreApi.listPodForAllNamespaces(),
  ])

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

    pods: pods.items.map(toPod),
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
