import { defineStore } from 'pinia'

export interface ClusterCapabilities {
  traffic: 'measured' | 'structural'
  connectionDiscovery: boolean
}

export const useClusterStore = defineStore('cluster', () => {
  const currentCluster = ref({ name: null })
  const isLoading = ref(false)
  const layoutMode = ref<'flow' | 'nodes' | 'namespaces'>('flow')
  const capabilities = ref<ClusterCapabilities | null>(null)

  return { currentCluster, isLoading, layoutMode, capabilities }
})