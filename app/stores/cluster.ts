import { defineStore } from 'pinia'
import type {
  Cluster,
  ClusterNode,
  Pod,
  PodPhase,
} from '#shared/types/cluster'

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

  const podList = ref<Pod[]>([])
  const nodeList = ref<ClusterNode[]>([])
  const selectedPod = ref<Pod | null>(null)

  const filters = ref<ClusterFilters>({
    search: '',
    namespaces: [],
    nodes: [],
    phases: [],
    hideSystem: false,
  })

  const visiblePods = computed(() => {
    const search = filters.value.search.toLowerCase()

    return podList.value.filter((pod) => {
      if (
        search
        && !pod.name.toLowerCase().includes(search)
        && !pod.namespace.toLowerCase().includes(search)
        && !(pod.node ?? '').toLowerCase().includes(search)
        && !(pod.workload ?? '').toLowerCase().includes(search)
      ) {
        return false
      }

      if (
        filters.value.namespaces.length
        && !filters.value.namespaces.includes(pod.namespace)
      ) {
        return false
      }

      if (
        filters.value.nodes.length
        && !filters.value.nodes.includes(pod.node ?? '')
      ) {
        return false
      }

      if (
        filters.value.phases.length
        && !filters.value.phases.includes(pod.phase)
      ) {
        return false
      }

      if (
        filters.value.hideSystem
        && pod.namespace === 'kube-system'
      ) {
        return false
      }

      return true
    })
  })

  const namespaceList = computed(() => [
    ...new Set(
      podList.value.map(pod => pod.namespace),
    ),
  ])

  const filtersActive = computed(() => {
    return (
      filters.value.search.length > 0
      || filters.value.namespaces.length > 0
      || filters.value.nodes.length > 0
      || filters.value.phases.length > 0
      || filters.value.hideSystem
    )
  })

  async function fetchClusters(): Promise<void> {
    isLoading.value = true

    try {
      const clusters = await $fetch<Cluster[]>('/api/clusters')

      clusterList.value = clusters

      const currentId = currentCluster.value?.id

      if (
        currentId
        && !clusters.some(
          cluster => cluster.id === currentId,
        )
      ) {
        currentCluster.value = null
      }

      if (!currentCluster.value) {
        const firstCluster = clusters[0]

        if (firstCluster) {
          selectCluster(firstCluster)
        }
      }
    }
    finally {
      isLoading.value = false
    }
  }

  function selectCluster(cluster: Cluster): void {
    if (currentCluster.value?.id === cluster.id) {
      return
    }

    currentCluster.value = cluster

    resetClusterData()
    resetFilters()
  }

  function resetClusterData(): void {
    podList.value = []
    nodeList.value = []
    selectedPod.value = null
  }

  function setClusterLoading(value: boolean): void {
    isLoading.value = value
  }

  function setPods(pods: Pod[]): void {
    podList.value = pods
  }

  function setNodes(nodes: ClusterNode[]): void {
    nodeList.value = nodes
  }

  function resetFilters(): void {
    filters.value = {
      search: '',
      namespaces: [],
      nodes: [],
      phases: [],
      hideSystem: false,
    }
  }

  function selectPod(pod: Pod | null): void {
    selectedPod.value = pod
  }

  return {
    clusterList,
    currentCluster,
    fetchClusters,
    selectCluster,

    isLoading,
    setClusterLoading,

    podList,
    visiblePods,
    nodeList,
    namespaceList,

    selectedPod,
    selectPod,

    filters,
    filtersActive,
    resetFilters,

    setPods,
    setNodes,
    resetClusterData,
  }
})