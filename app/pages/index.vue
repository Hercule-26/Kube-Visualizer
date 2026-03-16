<template>
  <div class="absolute inset-0 overflow-hidden bg-[#0b0f14]">
    <svg class="kv-canvas h-full w-full"></svg>

    <div v-if="clusterStore.isLoading" class="absolute inset-0 z-20 flex items-center justify-center bg-canvas-bg/30 backdrop-blur-[2px]">
      <div class="flex items-center gap-3 rounded-xl border border-white/10 bg-gray-900 px-5 py-3.5 shadow-xl shadow-black/20">
        <UIcon name="i-lucide-loader-circle" class="size-4 animate-spin text-blue-400" />
        <div>
          <p class="text-sm font-medium text-white">Loading cluster</p>
          <p class="mt-0.5 text-[11px] text-white/50">Retrieving cluster data...</p>
        </div>
      </div>
    </div>

    <div v-else class="absolute inset-0 flex items-center justify-center">
      <div class="flex flex-col items-center rounded-xl border border-default bg-default px-5 py-3.5 text-center shadow-xl shadow-black/10">
        <UIcon name="i-lucide-layers-3" class="mb-3 size-8 text-dimmed" />
        <p class="text-sm font-medium text-highlighted">
          {{ clusterStore.currentCluster ? 'Graph coming soon' : 'No cluster selected' }}
        </p>
        <p class="mt-1 text-xs text-dimmed">
          {{ clusterStore.currentCluster ? 'Cluster data is available in the side panels.' : 'Select a cluster to load its data.' }}
        </p>
      </div>
    </div>

    <div class="pointer-events-none absolute right-3 top-3 z-10">
      <GraphControls @zoom-in="zoomIn" @zoom-out="zoomOut" @fit="fitToContent" />
    </div>

    <div class="pointer-events-none absolute bottom-3 left-3 z-10">
      <Legend />
    </div>
  </div>
</template>

<script setup lang="ts">
const clusterStore = useClusterStore()

function zoomIn(): void {}

function zoomOut(): void {}

function fitToContent(): void {}
</script>
