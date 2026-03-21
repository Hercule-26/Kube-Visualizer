<template>
  <div class="shrink-0 space-y-2.5 border-b border-default p-3.5">
    <div class="flex items-center justify-between gap-2">
      <p class="text-[10px] font-medium uppercase tracking-wide text-dimmed">
        Pod details
      </p>

      <UButton
        icon="i-lucide-x"
        color="neutral"
        variant="ghost"
        size="xs"
        aria-label="Close pod details"
        @click="emit('close')"
      />
    </div>

    <div v-if="pod" class="flex min-w-0 items-center gap-2.5">
      <span class="relative flex size-2.5 shrink-0">
        <span
          class="absolute inline-flex size-full rounded-full opacity-40"
          :class="getPodStateColor(pod.phase, pod.ready)"
        />
        <span
          class="relative inline-flex size-2.5 rounded-full ring-2 ring-default"
          :class="getPodStateColor(pod.phase, pod.ready)"
        />
      </span>

      <div class="min-w-0 flex-1">
        <p
          class="truncate font-mono text-[12px] font-semibold text-highlighted"
          :title="pod.name"
        >
          {{ pod.name }}
        </p>

        <p class="truncate text-[10px] text-dimmed">
          {{ pod.namespace }}
        </p>
      </div>
    </div>

    <div v-else class="flex items-center gap-1.5 text-xs text-dimmed">
      <UIcon name="i-lucide-box-select" class="size-3.5 shrink-0" />
      No pod selected.
    </div>
  </div>
</template>

<script setup lang="ts">
import { getPodStateColor } from '~/utils/format'

const emit = defineEmits<{
  close: []
}>()

const clusterStore = useClusterStore()

const pod = computed(() =>
  clusterStore.selectedPodDetails ?? clusterStore.selectedPod,
)
</script>
