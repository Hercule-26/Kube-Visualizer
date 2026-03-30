import { createError, defineEventHandler, getRouterParam } from 'h3'
import * as k8s from '@kubernetes/client-node'

import { getCluster } from '~~/server/utils/clusters'
import { createKubernetesClient, toManifest } from '~~/server/utils/kubernetes'

const APPS_KINDS = ['Deployment', 'StatefulSet', 'DaemonSet']

export default defineEventHandler(async (event) => {
  const clusterId = getRouterParam(event, 'clusterId')
  const kind = getRouterParam(event, 'kind')
  const namespace = getRouterParam(event, 'namespace')
  const name = getRouterParam(event, 'name')

  if (!clusterId || !kind || !namespace || !name) {
    throw createError({ statusCode: 400, statusMessage: 'Missing workload identifiers.' })
  }

  if (!APPS_KINDS.includes(kind)) {
    throw createError({
      statusCode: 400,
      statusMessage: `${kind} manifests cannot be read here.`,
    })
  }

  const cluster = await getCluster(clusterId)

  if (!cluster) {
    throw createError({ statusCode: 404, statusMessage: 'Cluster not found.' })
  }

  const appsApi = createKubernetesClient(cluster).makeApiClient(k8s.AppsV1Api)

  try {
    const resource = await readWorkload(appsApi, kind, namespace, name)

    return { yaml: k8s.dumpYaml(toManifest(resource)) }
  }
  catch {
    throw createError({ statusCode: 404, statusMessage: 'Workload not found.' })
  }
})

function readWorkload(
  appsApi: k8s.AppsV1Api,
  kind: string,
  namespace: string,
  name: string,
) {
  if (kind === 'StatefulSet') {
    return appsApi.readNamespacedStatefulSet({ namespace, name })
  }

  if (kind === 'DaemonSet') {
    return appsApi.readNamespacedDaemonSet({ namespace, name })
  }

  return appsApi.readNamespacedDeployment({ namespace, name })
}
