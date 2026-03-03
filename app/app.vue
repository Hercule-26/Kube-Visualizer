<template>
  <div class="flex h-screen flex-col overflow-hidden">
    <AppHeader />

    <div class="flex flex-1 min-h-0">
      <LeftPanel v-model:open="sidebarOpen" />

      <main class="relative min-w-0 flex-1 overflow-auto">
        <UButton :icon="sidebarOpen ? 'i-lucide-panel-left-close' : 'i-lucide-panel-left-open'" color="neutral"
          variant="subtle" size="sm" class="absolute left-3 top-3 z-10"
          :aria-label="sidebarOpen ? 'Fermer le sidebar' : 'Ouvrir le sidebar'" @click="sidebarOpen = !sidebarOpen" />
        <NuxtPage />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
const sidebarOpen = ref(true)
</script>