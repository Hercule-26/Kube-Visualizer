import { defineWebSocketHandler } from 'h3'

import { getCluster } from '~~/server/utils/clusters'
import {
  subscribeToCluster,
  unsubscribeFromCluster,
} from '~~/server/utils/cluster-watchers'

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

      await subscribeToCluster(peer, config)
    }
    catch (error) {
      console.error('[WS] Error:', error)

      peer.send(JSON.stringify({
        type: 'cluster.error',
        message: 'Unable to retrieve cluster information.',
      }))
    }
  },
  close(peer) {
    unsubscribeFromCluster(peer)
  },
})
