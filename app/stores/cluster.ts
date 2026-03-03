import { defineStore } from 'pinia'

export const useClusterStore = defineStore('cluster', () => {
  const currentCluster = ref({ name: null })
  const isLoading = ref(false)

  return { currentCluster, isLoading }
})
