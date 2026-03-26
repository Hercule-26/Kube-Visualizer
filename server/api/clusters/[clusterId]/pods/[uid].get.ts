import { createError, defineEventHandler, getRouterParam } from 'h3'
import * as k8s from '@kubernetes/client-node'

import { getCluster } from '~~/server/utils/clusters'
import {
  createKubernetesClient,
  getReplicaSetOwners,
  toPodPhase,
  toWorkload,
} from '~~/server/utils/kubernetes'
import type { PodDetails } from '~~/shared/types/cluster'

export default defineEventHandler(async (event): Promise<PodDetails> => {
  const clusterId = getRouterParam(event, 'clusterId')
  const uid = getRouterParam(event, 'uid')

  if (!clusterId || !uid) {
    throw createError({ statusCode: 400, statusMessage: 'Cluster and pod identifiers are required.' })
  }

  const cluster = await getCluster(clusterId)

  if (!cluster) {
    throw createError({ statusCode: 404, statusMessage: 'Cluster not found.' })
  }

  const kubeConfig = createKubernetesClient(cluster)
  const api = kubeConfig.makeApiClient(k8s.CoreV1Api)

  const [pods, replicaSetOwners] = await Promise.all([
    api.listPodForAllNamespaces(),
    getReplicaSetOwners(kubeConfig),
  ])

  const pod = pods.items.find(item => item.metadata?.uid === uid)

  if (!pod) {
    throw createError({ statusCode: 404, statusMessage: 'Pod not found.' })
  }

  const statuses = pod.status?.containerStatuses ?? []
  const phase = toPodPhase(pod)

  const isReady = pod.status?.conditions?.some(
    condition => condition.type === 'Ready' && condition.status === 'True',
  ) ?? false

  return {
    uid: pod.metadata?.uid ?? '',
    name: pod.metadata?.name ?? '',
    namespace: pod.metadata?.namespace ?? '',
    phase,
    ready: phase === 'Running' && isReady,
    node: pod.spec?.nodeName ?? null,
    workload: toWorkload(pod, replicaSetOwners),
    restarts: statuses.reduce((total, status) => total + status.restartCount, 0),
    createdAt: pod.metadata?.creationTimestamp?.toString() ?? '',
    startedAt: pod.status?.startTime?.toString() ?? null,
    ip: pod.status?.podIP ?? null,
    serviceAccount: pod.spec?.serviceAccountName ?? null,
    labels: pod.metadata?.labels ?? {},
    annotations: pod.metadata?.annotations ?? {},
    containers: (pod.spec?.containers ?? []).map(container => {
      const status = statuses.find(item => item.name === container.name)
      const state = status?.state

      return {
        name: container.name,
        image: container.image ?? '',
        ready: status?.ready ?? false,
        restartCount: status?.restartCount ?? 0,
        state: state?.running ? 'Running' : state?.waiting ? 'Waiting' : state?.terminated ? 'Terminated' : 'Unknown',
        reason: state?.waiting?.reason ?? state?.terminated?.reason ?? null,
      }
    }),
    conditions: (pod.status?.conditions ?? []).map(condition => ({
      type: condition.type,
      status: condition.status,
      reason: condition.reason ?? null,
      message: condition.message ?? null,
    })),
    qosClass: pod.status?.qosClass ?? null,
  }
})
