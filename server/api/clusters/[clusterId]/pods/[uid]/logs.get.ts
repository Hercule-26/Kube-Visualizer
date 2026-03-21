import { request as httpRequest } from 'node:http'
import { request as httpsRequest } from 'node:https'
import { createError, createEventStream, defineEventHandler, getRouterParam } from 'h3'
import * as k8s from '@kubernetes/client-node'

import { getCluster } from '~~/server/utils/clusters'
import { createKubernetesClient } from '~~/server/utils/kubernetes'

const TAIL_LINES = 100

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

  const namespace = pod.metadata?.namespace ?? ''
  const name = pod.metadata?.name ?? ''
  const container = pod.spec?.containers?.[0]?.name ?? ''

  if (!container) {
    throw createError({ statusCode: 404, statusMessage: 'This pod has no container to read logs from.' })
  }

  const url = new URL(`${cluster.server}/api/v1/namespaces/${namespace}/pods/${name}/log`)
  url.searchParams.set('container', container)
  url.searchParams.set('follow', 'true')
  url.searchParams.set('tailLines', String(TAIL_LINES))
  url.searchParams.set('timestamps', 'true')

  const stream = createEventStream(event)

  function fail(message: string): void {
    stream
      .push({ event: 'failed', data: message })
      .then(() => stream.close())
      .catch(() => {})
  }

  const send = url.protocol === 'http:' ? httpRequest : httpsRequest

  const logRequest = send(
    url,
    {
      headers: { Authorization: `Bearer ${cluster.token}` },
      ca: cluster.insecureSkipTlsVerify ? undefined : Buffer.from(cluster.certificate, 'base64'),
      rejectUnauthorized: !cluster.insecureSkipTlsVerify,
    },
    (response) => {
      response.setEncoding('utf8')

      if (response.statusCode !== 200) {
        let body = ''

        response.on('data', (chunk) => {
          body += chunk
        })

        response.on('end', () => {
          fail(readKubernetesMessage(body))
        })

        return
      }

      let buffer = ''

      response.on('data', (chunk) => {
        buffer += chunk

        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (line.trim() !== '') {
            stream.push(line).catch(() => {})
          }
        }
      })

      response.on('end', () => {
        stream.close().catch(() => {})
      })

      response.on('error', () => {
        stream.close().catch(() => {})
      })
    },
  )

  logRequest.on('error', () => {
    fail('Unable to read the logs of this container.')
  })

  logRequest.end()

  stream.onClosed(() => {
    logRequest.destroy()
  })

  return stream.send()
})

function readKubernetesMessage(body: string): string {
  try {
    const parsed = JSON.parse(body) as { message?: string }

    if (parsed.message) {
      return parsed.message
    }
  }
  catch {
    return 'Unable to read the logs of this container.'
  }

  return 'Unable to read the logs of this container.'
}
