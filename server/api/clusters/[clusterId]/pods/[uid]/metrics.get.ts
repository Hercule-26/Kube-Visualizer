import { createError, defineEventHandler, getRouterParam } from 'h3'
import * as k8s from '@kubernetes/client-node'

import { getCluster } from '~~/server/utils/clusters'
import {
  createKubernetesClient,
  parseCpu,
  parseMemory,
} from '~~/server/utils/kubernetes'
import type { PodMetrics } from '~~/shared/types/cluster'

export default defineEventHandler(async (event): Promise<PodMetrics> => {
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
  const pods = await api.listPodForAllNamespaces()
  const pod = pods.items.find(item => item.metadata?.uid === uid)

  if (!pod?.metadata?.name || !pod.metadata.namespace) {
    throw createError({ statusCode: 404, statusMessage: 'Pod not found.' })
  }

  let list

  try {
    list = await new k8s.Metrics(kubeConfig).getPodMetrics(pod.metadata.namespace)
  }
  catch {
    throw createError({
      statusCode: 503,
      statusMessage: 'metrics-server is not installed on this cluster.',
    })
  }

  const podMetrics = list.items.find(
    item => item.metadata.name === pod.metadata?.name,
  )

  if (!podMetrics) {
    throw createError({
      statusCode: 404,
      statusMessage: 'No metrics collected for this pod yet.',
    })
  }

  return {
    timestamp: podMetrics.timestamp,
    window: podMetrics.window,

    containers: podMetrics.containers.map((container) => {
      const spec = pod.spec?.containers.find(item => item.name === container.name)
      const limits = spec?.resources?.limits

      return {
        name: container.name,
        cpuMillicores: parseCpu(container.usage.cpu),
        memoryBytes: parseMemory(container.usage.memory),
        cpuLimitMillicores: limits?.cpu ? parseCpu(limits.cpu) : null,
        memoryLimitBytes: limits?.memory ? parseMemory(limits.memory) : null,
      }
    }),
  }
})
