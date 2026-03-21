<template>
  <div class="w-max p-8">
    <div v-if="!clusterStore.currentCluster"
      class="kv-card w-96 rounded-xl border border-default px-5 py-8 text-center">
      <UIcon name="i-lucide-layers-3" class="mx-auto size-8 text-dimmed" />

      <p class="mt-2 text-sm font-medium text-highlighted">
        No cluster selected
      </p>

      <p class="mt-1 text-xs text-dimmed">
        Select a cluster to load its data.
      </p>
    </div>

    <div v-else-if="groups.length === 0" class="kv-card w-96 rounded-xl border border-default px-5 py-8 text-center">
      <UIcon name="i-lucide-box" class="mx-auto size-8 text-dimmed" />

      <p class="mt-2 text-sm font-medium text-highlighted">
        No pod to display
      </p>

      <p class="mt-1 text-xs text-dimmed">
        No pod matches these filters.
      </p>
    </div>

    <div v-else class="flex flex-wrap items-start gap-5">
      <GraphPodGroup v-for="group in groups" :key="group.title" :title="group.title" :subtitle="subtitle"
        :workloads="group.workloads" :active-key="activeKey" @select="emit('select', $event)"
        @open="clusterStore.selectedWorkload = $event" @hover="clusterStore.hoveredWorkload = $event" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Pod } from '#shared/types/cluster'
import { getWorkloadKey } from '~/utils/format'
import { groupByWorkload } from '~/utils/workload'

const emit = defineEmits<{
  select: [uid: string]
}>()

const clusterStore = useClusterStore()

const activeKey = computed(() => {
  if (clusterStore.hoveredWorkload) {
    return clusterStore.hoveredWorkload
  }

  const pod = clusterStore.selectedPod

  if (!pod) {
    return null
  }

  return getWorkloadKey(pod)
})

const subtitle = computed(() => {
  if (clusterStore.layoutMode === 'nodes') {
    return 'node'
  }

  if (clusterStore.layoutMode === 'namespaces') {
    return 'namespace'
  }

  return 'cluster'
})

const groups = computed(() => {
  const pods = clusterStore.visiblePods

  if (pods.length === 0) {
    return []
  }

  if (clusterStore.layoutMode === 'nodes') {
    return groupPods(pods, pod => pod.node ?? 'Unscheduled')
  }

  if (clusterStore.layoutMode === 'namespaces') {
    return groupPods(pods, pod => pod.namespace)
  }

  return [{
    title: clusterStore.currentCluster?.name ?? 'All pods',
    workloads: groupByWorkload(pods),
  }]
})

function groupPods(pods: Pod[], getKey: (pod: Pod) => string) {
  const groupMap = new Map<string, Pod[]>()

  for (const pod of pods) {
    const key = getKey(pod)
    const list = groupMap.get(key) ?? []

    list.push(pod)
    groupMap.set(key, list)
  }

  return [...groupMap.entries()]
    .map(([title, list]) => ({ title, workloads: groupByWorkload(list) }))
    .sort((a, b) => a.title.localeCompare(b.title))
}
</script>
