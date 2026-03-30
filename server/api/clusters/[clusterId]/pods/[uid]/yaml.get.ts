import { createError, defineEventHandler, getRouterParam } from 'h3'
import * as k8s from '@kubernetes/client-node'

import { getCluster } from '~~/server/utils/clusters'
import { createKubernetesClient, toManifest } from '~~/server/utils/kubernetes'

export default defineEventHandler(async (event) => {
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

  return { yaml: k8s.dumpYaml(toManifest(pod)) }
})
