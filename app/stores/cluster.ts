import { defineStore } from 'pinia'
import type {
  Cluster,
  ClusterActivity,
  ClusterNode,
  Pod,
  PodDetails,
  PodPhase,
} from '#shared/types/cluster'

export type LayoutMode = 'flow' | 'nodes' | 'namespaces'

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
  const metricsAvailable = ref(true)
  const selectedPodUid = ref<string | null>(null)
  const selectedPod = ref<Pod | null>(null)
  const selectedPodDetails = ref<PodDetails | null>(null)
  const layoutMode = ref<LayoutMode>('flow')
  const hoveredWorkload = ref<string | null>(null)
  const selectedWorkload = ref<string | null>(null)
  const podPanelOpen = ref(false)

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

  const activities = ref<ClusterActivity[]>([])

  const toasts = useAppToast()

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
      if (!currentCluster.value) {
        isLoading.value = false
      }
    }
  }

  function selectCluster(cluster: Cluster): void {
    if (currentCluster.value?.id === cluster.id) {
      return
    }

    currentCluster.value = cluster
    isLoading.value = true

    resetClusterData()
    resetFilters()
  }

  function resetClusterData(): void {
    metricsAvailable.value = true
    podList.value = []
    nodeList.value = []
    selectedPodUid.value = null
    selectedPod.value = null
    selectedPodDetails.value = null
  }

  function setClusterLoading(value: boolean): void {
    isLoading.value = value
  }

  function setPods(pods: Pod[]): void {
    podList.value = pods

    const live = pods.find(pod => pod.uid === selectedPodUid.value)

    if (live) {
      selectedPod.value = live
    }
  }

  function setNodes(nodes: ClusterNode[]): void {
    nodeList.value = nodes
  }

  function setMetricsAvailable(available: boolean): void {
    if (metricsAvailable.value && !available) {
      toasts.warn(
        'Metrics unavailable',
        'metrics-server is not installed on this cluster, so pod usage cannot be shown.',
      )
    }

    metricsAvailable.value = available
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

  function selectPod(uid: string | null): void {
    selectedPodUid.value = uid

    selectedPod.value = uid
      ? podList.value.find(pod => pod.uid === uid) ?? null
      : null

    selectedPodDetails.value = null
  }

  function addActivity(activity: Omit<ClusterActivity, 'id' | 'timestamp'>): void {
    activities.value.unshift({
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ...activity
    })

    activities.value = activities.value.slice(0, 300)
  }

  function focusPod(uid: string): void {
    const pod = podList.value.find(item => item.uid === uid) ?? null

    selectPod(pod ? uid : null)
    selectedWorkload.value = null
    podPanelOpen.value = pod !== null

    if (pod) {
      void fetchPodDetails(uid)
    }
  }

  function selectWorkload(key: string | null): void {
    selectedWorkload.value = key

    if (key) {
      podPanelOpen.value = false
    }
  }

  function clearSelection(): void {
    selectPod(null)
    selectedWorkload.value = null
  }

  async function fetchPodDetails(uid: string): Promise<void> {
    try {
      selectedPodDetails.value = await $fetch<PodDetails>(
        `/api/clusters/${currentCluster.value?.id}/pods/${uid}`
      )
    }
    catch {
      selectedPodDetails.value = null

      toasts.warn(
        'Pod details unavailable',
        'The pod could not be read. Its ip and QoS class are missing.',
      )
    }
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
    selectedPodDetails,
    layoutMode,
    hoveredWorkload,
    selectedWorkload,
    selectWorkload,
    podPanelOpen,
    clearSelection,

    filters,
    filtersActive,
    resetFilters,

    setPods,
    setNodes,
    metricsAvailable,
    setMetricsAvailable,
    activities,
    addActivity,

    fetchPodDetails,
    focusPod
  }
})
