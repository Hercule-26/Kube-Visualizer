import { defineStore } from 'pinia'

import type { PodPhase, Pod } from '#shared/types/cluster'

export interface ClusterCapabilities {
  traffic: 'measured' | 'structural'
  connectionDiscovery: boolean
}

export interface ClusterFilters {
  search: string
  namespaces: string[]
  nodes: string[]
  phases: PodPhase[]
  hideSystem: boolean
}

export const useClusterStore = defineStore('cluster', () => {
  const currentCluster = ref({
    name: null as string | null
  })

  const isLoading = ref(false)

  const layoutMode = ref<'flow' | 'nodes' | 'namespaces'>('flow')

  const capabilities = ref<ClusterCapabilities | null>(null)

  const filters = ref<ClusterFilters>({
    search: '',
    namespaces: [],
    nodes: [],
    phases: [],
    hideSystem: false,
  })

  const filtersActive = computed(() => {
    return (
      filters.value.search.length > 0 ||
      filters.value.namespaces.length > 0 ||
      filters.value.nodes.length > 0 ||
      filters.value.phases.length > 0 ||
      filters.value.hideSystem
    )
  })

  function resetFilters() {
    filters.value = {
      search: '',
      namespaces: [],
      nodes: [],
      phases: [],
      hideSystem: false,
    }
  }

  const podList = ref<Pod[]>([])
  const visiblePods = ref<Pod[]>([{ uid: 'placeholder', name: 'Loading...', namespace: '', phase: 'Pending', ready: false, node: null, workload: null, restarts: 0, createdAt: '', startedAt: null }, { uid: 'placeholder', name: 'Loading...', namespace: '', phase: 'Pending', ready: false, node: null, workload: null, restarts: 0, createdAt: '', startedAt: null }])
  const selectedPod = ref<Pod | null>(null)
  const nodeList = ref<ClusterNode[]>([])
  const namespaceList = computed(() => {
    return [...new Set(podList.value.map((pod : Pod) => pod.namespace))]
  })

  return {
  currentCluster,
  isLoading,
  layoutMode,
  capabilities,

  podList,
  visiblePods,
  selectedPod,
  nodeList,
  namespaceList,

  filters,
  filtersActive,
  resetFilters
}
})