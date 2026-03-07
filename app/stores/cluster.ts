import { defineStore } from 'pinia'
import type {
  Cluster,
  ClusterNode,
  Pod,
  PodPhase,
} from '#shared/types/cluster'

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
  const clusterList = ref<Cluster[]>([])
  const currentCluster = ref<Cluster | null>(null)

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
      filters.value.search.length > 0
      || filters.value.namespaces.length > 0
      || filters.value.nodes.length > 0
      || filters.value.phases.length > 0
      || filters.value.hideSystem
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

  const visiblePods = ref<Pod[]>([
    {
      uid: 'placeholder-1',
      name: 'Loading...',
      namespace: '',
      phase: 'Pending',
      ready: false,
      node: null,
      workload: null,
      restarts: 0,
      createdAt: '',
      startedAt: null,
    },
    {
      uid: 'placeholder-2',
      name: 'Loading...',
      namespace: '',
      phase: 'Pending',
      ready: false,
      node: null,
      workload: null,
      restarts: 0,
      createdAt: '',
      startedAt: null,
    },
  ])

  const selectedPod = ref<Pod | null>(null)

  const nodeList = ref<ClusterNode[]>([])

  const namespaceList = computed(() => {
    return [
      ...new Set(
        podList.value.map(pod => pod.namespace),
      ),
    ]
  })

  async function fetchClusters(): Promise<void> {
    isLoading.value = true
    try {
      const clusters = await $fetch<Cluster[]>('/api/clusters')
      clusterList.value = clusters
      const currentName = currentCluster.value?.name
      if (currentName && !clusters.some(cluster => cluster.name === currentName)) {
        currentCluster.value = null
      }

      if (!currentCluster.value) {
        const firstCluster = clusters[0]
      
        if (firstCluster) {
          currentCluster.value = firstCluster
        }
      }
    }
    finally {
      isLoading.value = false
    }
  }

  function selectCluster(cluster: Cluster): void {
    currentCluster.value = cluster
    resetFilters()
    podList.value = []
    selectedPod.value = null
    nodeList.value = []
    capabilities.value = null
  }

  function selectPod(pod: Pod | null): void {
    selectedPod.value = pod
  }

  return {
    clusterList,
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
    resetFilters,

    fetchClusters,
    selectCluster,
    selectPod,
  }
})