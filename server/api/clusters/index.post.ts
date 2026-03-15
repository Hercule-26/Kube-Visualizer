import { randomUUID } from 'node:crypto'
import { createError, defineEventHandler, getQuery, readBody } from 'h3'

import type { ClusterConfig } from '~~/shared/types/cluster'

import {
  kubernetesErrorMessage,
  testClusterConnection,
} from '~~/server/utils/kubernetes'

import { saveCluster } from '~~/server/utils/clusters'

export default defineEventHandler(async (event) => {
  const body = await readBody<Partial<ClusterConfig>>(event)
  const editableKinds = Array.isArray(body?.editableKinds)
    ? body.editableKinds
    : []

  if (!body?.name?.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Cluster name is required.',
    })
  }

  if (!body?.server?.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Kubernetes API server URL is required.',
    })
  }

  if (!body?.token?.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ServiceAccount token is required.',
    })
  }

  if (
    !body?.insecureSkipTlsVerify
    && !body?.certificate?.trim()
  ) {
    throw createError({
      statusCode: 400,
      statusMessage:
        'Cluster CA certificate is required unless TLS verification is disabled.',
    })
  }

  if (
    body?.allowWrite
    && editableKinds.length === 0
  ) {
    throw createError({
      statusCode: 400,
      statusMessage:
        'At least one editable kind must be selected when write access is enabled.',
    })
  }

  const config: ClusterConfig = {
    id: randomUUID(),
    name: body.name!.trim(),
    server: body.server!.trim(),
    token: body.token!.trim(),
    certificate: body?.certificate?.trim() ?? '',
    insecureSkipTlsVerify: Boolean(body?.insecureSkipTlsVerify),
    allowWrite: Boolean(body?.allowWrite),
    allowPodDelete: Boolean(body?.allowPodDelete),
    editableKinds,
  }

  try {
    await testClusterConnection(config)
  }
  catch (error) {
    throw createError({
      statusCode: 502,
      statusMessage: kubernetesErrorMessage(error),
    })
  }

  const dryRun = getQuery(event).dryRun === 'true'

  if (!dryRun) {
    await saveCluster(config)
  }

  return {
    ok: true,
    message: dryRun
      ? 'Cluster connection tested successfully.'
      : 'Cluster connected successfully.',
    cluster: {
      id: config.id,
      name: config.name,
      server: config.server,
      insecureSkipTlsVerify: config.insecureSkipTlsVerify,
      allowWrite: config.allowWrite,
      allowPodDelete: config.allowPodDelete,
      editableKinds: config.editableKinds,
    },
  }
})
