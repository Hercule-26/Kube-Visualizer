import { createError, defineEventHandler, getRouterParam } from 'h3'
import * as k8s from '@kubernetes/client-node'

import { getCluster } from '~~/server/utils/clusters'
import { createKubernetesClient } from '~~/server/utils/kubernetes'
import type { PodDetails, PodPhase } from '~~/shared/types/cluster'

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

  const api = createKubernetesClient(cluster).makeApiClient(k8s.CoreV1Api)
  const pods = await api.listPodForAllNamespaces()
  const pod = pods.items.find(item => item.metadata?.uid === uid)

  if (!pod) {
    throw createError({ statusCode: 404, statusMessage: 'Pod not found.' })
  }

  const statuses = pod.status?.containerStatuses ?? []
  const crashLoop = statuses.some(
    status => status.state?.waiting?.reason === 'CrashLoopBackOff',
  )
  const owner = pod.metadata?.ownerReferences?.[0]

  return {
    uid: pod.metadata?.uid ?? '',
    name: pod.metadata?.name ?? '',
    namespace: pod.metadata?.namespace ?? '',
    phase: (crashLoop ? 'CrashLoopBackOff' : pod.status?.phase ?? 'Unknown') as PodPhase,
    ready: pod.status?.conditions?.some(
      condition => condition.type === 'Ready' && condition.status === 'True',
    ) ?? false,
    node: pod.spec?.nodeName ?? null,
    workload: owner ? `${owner.kind}/${owner.name}` : null,
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
