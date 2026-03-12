import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { ClusterConfig } from '~~/shared/types/cluster'

const DATA_DIR = join(process.cwd(), '.data')
const CLUSTERS_FILE = join(DATA_DIR, 'clusters.json')

async function ensureStorage(): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true })

  try {
    await readFile(CLUSTERS_FILE, 'utf8')
  }
  catch {
    await writeFile(CLUSTERS_FILE, '[]', 'utf8')
  }
}

export async function getClusters(): Promise<ClusterConfig[]> {
  await ensureStorage()

  const content = await readFile(CLUSTERS_FILE, 'utf8')

  if (!content.trim()) {
    return []
  }

  return JSON.parse(content) as ClusterConfig[]
}

export async function getCluster(id: string): Promise<ClusterConfig | undefined> {
  const clusters = await getClusters()
  return clusters.find(cluster => cluster.id === id)
}

export async function saveCluster(
  config: ClusterConfig,
): Promise<ClusterConfig> {
  const clusters = await getClusters()

  const index = clusters.findIndex(
    cluster => cluster.name === config.name,
  )

  if (index === -1) {
    clusters.push(config)
  }
  else {
    clusters[index] = config
  }

  await writeFile(
    CLUSTERS_FILE,
    JSON.stringify(clusters, null, 2),
    'utf8',
  )

  return config
}

export async function deleteCluster(
  name: string,
): Promise<boolean> {
  const clusters = await getClusters()

  const filtered = clusters.filter(
    cluster => cluster.name !== name,
  )

  if (filtered.length === clusters.length) {
    return false
  }

  await writeFile(
    CLUSTERS_FILE,
    JSON.stringify(filtered, null, 2),
    'utf8',
  )

  return true
}