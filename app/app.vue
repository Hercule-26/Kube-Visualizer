<template>
  <UApp>
    <div class="flex h-screen flex-col overflow-hidden">
      <AppHeader />

      <div class="relative flex min-h-0 flex-1 overflow-hidden">
        <LeftPanel
          v-model:open="sidebarOpen"
          @focus-pod="onFocusPod"
        />

        <main class="relative min-w-0 flex-1 overflow-hidden">
          <UButton
            :icon="
              sidebarOpen
                ? 'i-lucide-panel-left-close'
                : 'i-lucide-panel-left-open'
            "
            color="neutral"
            variant="subtle"
            size="sm"
            class="absolute left-3 top-3 z-10"
            :aria-label="
              sidebarOpen
                ? 'Close sidebar'
                : 'Open sidebar'
            "
            @click="sidebarOpen = !sidebarOpen"
          />

          <NuxtPage />
        </main>

        <RightPanel
          v-model:open="rightPanelOpen"
        />
      </div>
    </div>
  </UApp>
</template>

<script setup lang="ts">
const sidebarOpen = ref(true)
const rightPanelOpen = ref(false)

const clusterStore = useClusterStore()
const socket = useWebSocket()

onMounted(async () => {
  await clusterStore.fetchClusters()
  socket.connect()
})

watch(() => clusterStore.currentCluster?.id, (clusterId, previousId) => {
  if (clusterId && clusterId !== previousId) {
    socket.refresh()
  }
})

function onFocusPod(uid: string): void {
  clusterStore.selectPod(
    clusterStore.podList.find(
      pod => pod.uid === uid
    ) ?? null,
  )

  if (clusterStore.selectedPod) {
    clusterStore.fetchPodDetails(uid)
  }

  rightPanelOpen.value = true
}
</script>
