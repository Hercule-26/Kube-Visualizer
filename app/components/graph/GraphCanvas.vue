<template>
  <div ref="viewport" class="kv-canvas absolute inset-0 select-none overflow-hidden"
    :class="panning ? 'kv-canvas--panning' : ''" @wheel="onCanvasWheel" @pointerdown="onCanvasPointerDown"
    @pointermove="onPointerMove" @pointerup="onPointerUp" @pointercancel="onPointerUp" @click.capture="onClickCapture"
    @click="emit('background')">
    <div ref="content" class="absolute left-0 top-0 w-max origin-top-left"
      :style="{ transform: `translate(${x}px, ${y}px) scale(${scale})` }">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  background: []
}>()

const viewport = ref<HTMLElement | null>(null)
const content = ref<HTMLElement | null>(null)

const {
  x,
  y,
  scale,
  panning,
  onWheel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  wasDragged,
  zoomIn,
  zoomOut,
  fit,
} = useViewport(viewport)

const interacted = ref(false)

let observer: ResizeObserver | null = null

function fitContent(): void {
  fit(content.value?.offsetWidth ?? 0, content.value?.offsetHeight ?? 0, 90)
}

function onCanvasWheel(event: WheelEvent): void {
  interacted.value = true
  onWheel(event)
}

function onCanvasPointerDown(event: PointerEvent): void {
  interacted.value = true
  onPointerDown(event)
}

function onClickCapture(event: MouseEvent): void {
  if (wasDragged()) {
    event.stopPropagation()
    event.preventDefault()
  }
}

onMounted(() => {
  if (!content.value) {
    return
  }

  observer = new ResizeObserver(() => {
    if (!interacted.value) {
      fitContent()
    }
  })

  observer.observe(content.value)
})

onUnmounted(() => {
  observer?.disconnect()
  observer = null
})

function forceFit(): void {
  interacted.value = false
  fitContent()
}

defineExpose({ zoomIn, zoomOut, fit: forceFit })
</script>
