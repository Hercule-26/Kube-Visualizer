<template>
  <div class="absolute inset-0 overflow-hidden">
    <GraphCanvas ref="canvas" @background="clusterStore.clearSelection()">
      <GraphPodBoard @select="clusterStore.focusPod($event)" />
    </GraphCanvas>

    <div
      v-if="emptyMessage && !clusterStore.isLoading"
      class="pointer-events-none absolute inset-0 flex items-center justify-center p-6"
    >
      <div class="kv-card w-80 rounded-xl border border-default px-5 py-8 text-center shadow-sm">
        <UIcon :name="emptyMessage.icon" class="mx-auto size-8 text-dimmed" />

        <p class="mt-2 text-sm font-medium text-highlighted">
          {{ emptyMessage.title }}
        </p>

        <p class="mt-1 text-xs text-dimmed">
          {{ emptyMessage.hint }}
        </p>
      </div>
    </div>

    <div v-if="clusterStore.isLoading"
      class="absolute inset-0 z-20 flex items-center justify-center bg-canvas-bg/30 backdrop-blur-[2px]">
      <div
        class="flex items-center gap-3 rounded-xl border border-white/10 bg-gray-900 px-5 py-3.5 shadow-xl shadow-black/20">
        <UIcon name="i-lucide-loader-circle" class="size-4 animate-spin text-blue-400" />

        <div>
          <p class="text-sm font-medium text-white">
            Loading cluster
          </p>

          <p class="mt-0.5 text-[11px] text-white/50">
            Retrieving cluster data...
          </p>
        </div>
      </div>
    </div>

    <div class="pointer-events-none absolute right-3 top-3 z-10">
      <GraphControls @zoom-in="canvas?.zoomIn()" @zoom-out="canvas?.zoomOut()" @fit="canvas?.fit()" />
    </div>

    <div class="pointer-events-none absolute bottom-3 left-3 z-10">
      <Legend />
    </div>
  </div>
</template>

<script setup lang="ts">
const clusterStore = useClusterStore()

const emptyMessage = computed(() => {
  if (!clusterStore.currentCluster) {
    return {
      icon: 'i-lucide-layers-3',
      title: 'No cluster selected',
      hint: 'Select a cluster to load its data.',
    }
  }

  if (clusterStore.visiblePods.length === 0) {
    return {
      icon: 'i-lucide-box',
      title: 'No pod to display',
      hint: 'No pod matches these filters.',
    }
  }

  return null
})

const canvas = ref<{
  zoomIn: () => void
  zoomOut: () => void
  fit: () => void
} | null>(null)

const fitKey = computed(() =>
  `${clusterStore.currentCluster?.id}:${clusterStore.visiblePods.length > 0}`,
)

let fittedFor: string | null = null

watch(fitKey, (key) => {
  if (clusterStore.visiblePods.length === 0 || fittedFor === key) {
    return
  }

  fittedFor = key
  nextTick(() => canvas.value?.fit())
}, { immediate: true })

watch(
  () => clusterStore.layoutMode,
  () => nextTick(() => canvas.value?.fit()),
)
</script>
