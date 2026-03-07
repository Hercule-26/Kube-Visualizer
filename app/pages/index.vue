<template>
  <div class="absolute inset-0 overflow-hidden bg-[#0b0f14]">
    <svg ref="svgRef" class="kv-canvas h-full w-full"></svg>

    <!-- Loading overlay -->
    <Transition enter-active-class="transition-opacity duration-200" enter-from-class="opacity-0"
      enter-to-class="opacity-100" leave-active-class="transition-opacity duration-200" leave-from-class="opacity-100"
      leave-to-class="opacity-0">
      <div v-if="isLoading"
        class="absolute inset-0 z-20 flex items-center justify-center bg-canvas-bg/30 backdrop-blur-[2px]">
        <div class="
            flex items-center gap-3
            rounded-xl
            border border-white/10
            bg-gray-900
            px-5 py-3.5
            shadow-xl shadow-black/20
          ">
          <UIcon name="i-lucide-loader-circle" class="size-4 animate-spin text-blue-400" />

          <div>
            <p class="text-sm font-medium text-white">
              Loading cluster
            </p>

            <p class="mt-0.5 text-[11px] text-white/50">
              Building graph…
            </p>
          </div>
        </div>
      </div>
    </Transition>

    <Transition enter-active-class="transition-opacity duration-300" enter-from-class="opacity-0"
      enter-to-class="opacity-100" leave-active-class="transition-opacity duration-200" leave-from-class="opacity-100"
      leave-to-class="opacity-0">
      <div v-if="!isLoading && !clusterStore.currentCluster?.name"
        class="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
        <div
          class="flex flex-col items-center rounded-xl border border-default bg-default px-5 py-3.5 text-center shadow-xl shadow-black/10">
          <UIcon name="i-lucide-layers-3" class="mb-3 size-8 text-dimmed" />

          <p class="text-sm font-medium text-highlighted">
            No cluster selected
          </p>

          <p class="mt-1 text-xs text-dimmed">
            Select a cluster to visualize its graph.
          </p>
        </div>
      </div>
    </Transition>

    <div class="pointer-events-none absolute right-3 top-3 z-10">
      <GraphControls @zoom-in="canvasRef?.zoomIn()" @zoom-out="canvasRef?.zoomOut()"
        @fit="canvasRef?.fitToContent(true)" />
    </div>

    <div class="pointer-events-none absolute bottom-3 left-3 z-10">
      <Legend />
    </div>
  </div>
</template>

<script setup lang="ts">
const clusterStore = useClusterStore()

const canvasRef = ref<{
  fitToContent: (animated?: boolean) => void
  zoomIn: () => void
  zoomOut: () => void
} | null>(null)

const isLoading = ref(true)

onMounted(() => {
  clusterStore.fetchClusters()
  setTimeout(() => {
    isLoading.value = false
  }, 3000)
})
</script>