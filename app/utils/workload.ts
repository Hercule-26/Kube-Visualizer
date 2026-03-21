import type { Pod } from '#shared/types/cluster'
import { getWorkloadKey, getWorkloadKind, getWorkloadName } from '~/utils/format'

export interface Workload {
  key: string
  name: string
  namespace: string
  kind: string
  apiKind: string
  pods: Pod[]
}

export function groupByWorkload(pods: Pod[]): Workload[] {
  const groups = new Map<string, Pod[]>()

  for (const pod of pods) {
    const key = getWorkloadKey(pod)
    const list = groups.get(key) ?? []

    list.push(pod)
    groups.set(key, list)
  }

  const workloads: Workload[] = []

  for (const [key, list] of groups) {
    const first = list[0]

    if (!first) {
      continue
    }

    workloads.push({
      key,
      name: getWorkloadName(first),
      namespace: first.namespace,
      kind: getWorkloadKind(first.workload),
      apiKind: first.workload?.split('/')[0] ?? 'Pod',
      pods: [...list].sort((a, b) => a.name.localeCompare(b.name)),
    })
  }

  return workloads.sort((a, b) => a.name.localeCompare(b.name))
}
