<template>
  <div class="absolute inset-0 overflow-hidden">
    <ClientOnly>
      <GraphCanvas ref="canvasRef" />
      <template #fallback>
        <div class="flex h-full items-center justify-center text-sm text-dimmed">
          <UIcon name="i-lucide-loader" class="mr-2 size-4 animate-spin" />
          Loading the cluster graph…
        </div>
      </template>
    </ClientOnly>

    <div class="pointer-events-none absolute right-3 top-3 z-10">
      <GraphControls
        @zoom-in="canvasRef?.zoomIn()"
        @zoom-out="canvasRef?.zoomOut()"
        @fit="canvasRef?.fitToContent(true)"
      />
    </div>

    <div class="pointer-events-none absolute bottom-3 left-3 z-10">
      <Legend />
    </div>
  </div>
</template>

<script setup lang="ts">
const canvasRef = ref<{
  fitToContent: (animated?: boolean) => void,
  zoomIn: () => void,
  zoomOut: () => void,
} | null>(null)
</script>