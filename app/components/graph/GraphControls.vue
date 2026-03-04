<script setup lang="ts">
import type { RadioGroupItem } from '@nuxt/ui'
import type { LayoutMode } from '~~/app/types/graph'

const emit = defineEmits<{
  zoomIn: []
  zoomOut: []
  fit: []
}>()

const store = useClusterStore()

const MODES: RadioGroupItem[] = [
  { value: 'flow', label: 'Flow', icon: 'i-lucide-git-fork' },
  { value: 'nodes', label: 'Nodes', icon: 'i-lucide-server' },
  { value: 'namespaces', label: 'Namespaces', icon: 'i-lucide-folder-tree' },
]

const VIEW_CONTROLS: Array<{ label: string, icon: string, action: () => void }> = [
  { label: 'Zoom in', icon: 'i-lucide-plus', action: () => emit('zoomIn') },
  { label: 'Zoom out', icon: 'i-lucide-minus', action: () => emit('zoomOut') },
  { label: 'Fit the whole cluster', icon: 'i-lucide-maximize', action: () => emit('fit') },
]
</script>

<template>
  <div class="pointer-events-auto flex flex-col items-end gap-4">
    <div class="overflow-hidden rounded-lg shadow-sm backdrop-blur">
      <URadioGroup
        v-model="store.layoutMode"
        :items="MODES"
        orientation="horizontal"
        variant="table"
        indicator="hidden"
        color="info"
        size="lg"
        :ui="{
          fieldset: 'bg-default/90',
          item: 'gap-1 border-default px-3 py-1.5',
          wrapper: 'flex-row items-center gap-1.5',
          label: 'text-[13px] font-medium',
          icon: 'size-3.5'
        }"
      />
    </div>

    <div class="flex flex-col overflow-hidden rounded-lg border border-default bg-default/90 shadow-sm backdrop-blur">
      <UTooltip
        v-for="control in VIEW_CONTROLS"
        :key="control.label"
        :text="control.label"
        :content="{ side: 'left' }"
      >
        <UButton
          :icon="control.icon"
          color="neutral"
          variant="ghost"
          size="sm"
          class="rounded-none"
          @click="control.action()"
        />
      </UTooltip>
    </div>
  </div>
</template>