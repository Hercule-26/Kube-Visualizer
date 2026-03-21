<template>
  <section class="kv-group relative w-fit rounded-2xl p-4">
    <svg class="pointer-events-none absolute inset-0 size-full overflow-visible" aria-hidden="true">
      <rect x="0" y="0" width="100%" height="100%" rx="16" fill="none" stroke="var(--canvas-group-border)"
        stroke-width="1" stroke-dasharray="6 6" />
    </svg>

    <div class="mb-3 min-w-0">
      <h3 class="truncate text-sm font-semibold text-highlighted" :title="title">
        {{ title }}
      </h3>

      <p class="font-mono text-[10px] text-dimmed">
        {{ subtitle }}
      </p>
    </div>

    <div class="grid grid-cols-2 gap-3">
      <GraphWorkloadCard
        v-for="workload in workloads"
        :key="workload.key"
        :workload="workload"
        :dimmed="activeKey !== null && workload.key !== activeKey"
        @select="emit('select', $event)"
        @open="emit('open', $event)"
        @hover="emit('hover', $event)"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Workload } from '~/utils/workload'

defineProps<{
  title: string
  subtitle: string
  workloads: Workload[]
  activeKey: string | null
}>()

const emit = defineEmits<{
  select: [uid: string]
  open: [key: string]
  hover: [key: string | null]
}>()
</script>
