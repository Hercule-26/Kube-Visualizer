<template>
  <UApp>
    <div class="flex h-screen flex-col overflow-hidden">
      <AppHeader />

      <div class="flex flex-1 min-h-0">
        <LeftPanel v-model:open="sidebarOpen" @focus-pod="onFocusPod"/>

        <main class="relative min-w-0 flex-1 overflow-hidden">
          <UButton
            :icon="sidebarOpen ? 'i-lucide-panel-left-close' : 'i-lucide-panel-left-open'"
            color="neutral"
            variant="subtle"
            size="sm"
            class="absolute left-3 top-3 z-10"
            :aria-label="sidebarOpen ? 'Close sidebar' : 'Open sidebar'"
            @click="sidebarOpen = !sidebarOpen"
          />
          <NuxtPage />
        </main>

        <RightPanel v-model:open="sidebarOpen" />
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

function onFocusPod(uid: string): void {
  clusterStore.selectedPod = clusterStore.podList.find((pod) => pod.uid === uid) || null
  rightPanelOpen.value = true
}
</script>