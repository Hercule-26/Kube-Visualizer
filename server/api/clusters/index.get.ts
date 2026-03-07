import { defineEventHandler } from 'h3'
import type { Cluster } from '~~/shared/types/cluster'
import { getClusters } from '~~/server/utils/clusters'

export default defineEventHandler(async (): Promise<Cluster[]> => {
  const configs = await getClusters()

  return configs.map(({ token, certificate, ...cluster }) => cluster)
})