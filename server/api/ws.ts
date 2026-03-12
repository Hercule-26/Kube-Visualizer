import { defineWebSocketHandler } from 'h3'
import * as k8s from '@kubernetes/client-node'

import { getCluster } from '~~/server/utils/clusters'
import { createKubernetesClient } from '~~/server/utils/kubernetes'

export default defineWebSocketHandler({
  async message(peer, message) {
    try {
      const data = JSON.parse(message.text())
      
      if (data.type !== 'cluster.select') {
        return
      }
      
      const config = await getCluster(data.clusterId)

      if (!config) {
        peer.send(JSON.stringify({
          type: 'cluster.error',
          message: `Cluster "${data.clusterId}" not found.`,
        }))

        return
      }

      const kubeConfig = createKubernetesClient(config)
      const coreApi = kubeConfig.makeApiClient(k8s.CoreV1Api)

      const [nodes, pods] = await Promise.all([
        coreApi.listNode(),
        coreApi.listPodForAllNamespaces(),
      ])

      peer.send(JSON.stringify({
        type: 'cluster.state',
        data: {
          cluster: {
            id: config.id,
            name: config.name,
            server: config.server,
            insecureSkipTlsVerify: config.insecureSkipTlsVerify,
            allowWrite: config.allowWrite,
            allowPodDelete: config.allowPodDelete,
            editableKinds: config.editableKinds,
          },
          nodes: nodes.items.map(node => ({
            name: node.metadata?.name ?? '',
          })),
          pods: pods.items.map(pod => ({
            uid: pod.metadata?.uid ?? '',
            name: pod.metadata?.name ?? '',
            namespace: pod.metadata?.namespace ?? '',
            phase: pod.status?.phase ?? 'Unknown',
            ready: false,
            node: pod.spec?.nodeName ?? null,
            workload: null,
            restarts: 0,
            createdAt: pod.metadata?.creationTimestamp ?? '',
            startedAt: pod.status?.startTime ?? null,
          })),
        },
      }))
    }
    catch (error) {
      console.error('[WS] Error:', error)

      peer.send(JSON.stringify({
        type: 'cluster.error',
        message: 'Unable to retrieve cluster information.',
      }))
    }
  },
})