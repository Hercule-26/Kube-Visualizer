<template>
  <div
    class="kv-card relative w-56 cursor-pointer overflow-hidden rounded-xl border px-3 pb-3 pt-3.5 shadow-sm transition-all duration-150 hover:border-accented"
    :class="[
      holdsSelection ? 'border-info' : 'border-default',
      dimmed ? 'opacity-30' : 'opacity-100',
    ]" @click.stop="emit('open', workload.key)" @pointerenter="emit('hover', workload.key)"
    @pointerleave="emit('hover', null)">
    <span class="absolute inset-x-0 top-0 h-1" :class="accentColor" />

    <div class="flex min-w-0 items-baseline justify-between gap-2">
      <span class="truncate text-[13px] font-semibold text-highlighted" :title="workload.name">
        {{ workload.name }}
      </span>

      <span class="shrink-0 font-mono text-[11px]"
        :class="readyCount < workload.pods.length ? 'text-(--status-pending)' : 'text-dimmed'">
        {{ readyCount }}/{{ workload.pods.length }}
      </span>
    </div>

    <div class="mt-0.5 flex min-w-0 items-baseline justify-between gap-2">
      <span class="truncate font-mono text-[10px] text-dimmed">
        {{ workload.namespace }}
      </span>

      <span class="shrink-0 font-mono text-[10px] text-dimmed">
        {{ workload.kind }}
      </span>
    </div>

    <div class="mt-3 flex flex-wrap items-center justify-center gap-2">
      <button v-for="pod in workload.pods" :key="pod.uid" type="button" :title="podTitle(pod)" :aria-label="pod.name"
        class="size-3 rounded-full transition-all hover:scale-125" :class="[
          getPodStateColor(pod.phase, pod.ready),
          isSettling(pod) ? 'animate-pulse' : '',
          pod.restarts > 0 ? 'ring-2 ring-(--status-pending)' : '',
          clusterStore.selectedPod?.uid === pod.uid
            ? 'outline-2 outline-offset-2 outline-info'
            : '',
          ]" 
        @click.stop="emit('select', pod.uid)" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Pod } from '#shared/types/cluster'
import type { Workload } from '~/utils/workload'
import { getPodStateColor, getPodStateLabel } from '~/utils/format'

const props = defineProps<{
  workload: Workload
  dimmed: boolean
}>()

const emit = defineEmits<{
  select: [uid: string]
  open: [key: string]
  hover: [key: string | null]
}>()

const clusterStore = useClusterStore()

const readyCount = computed(() =>
  props.workload.pods.filter(pod => pod.ready).length,
)

const holdsSelection = computed(() =>
  props.workload.pods.some(
    pod => pod.uid === clusterStore.selectedPod?.uid,
  ),
)

const accentColor = computed(() => {
  const broken = props.workload.pods.find(
    pod => pod.phase === 'CrashLoopBackOff' || pod.phase === 'Failed',
  )

  if (broken) {
    return getPodStateColor(broken.phase)
  }

  const leaving = props.workload.pods.find(
    pod => pod.phase === 'Terminating',
  )

  if (leaving) {
    return getPodStateColor('Terminating')
  }

  if (readyCount.value < props.workload.pods.length) {
    return 'bg-[var(--status-pending)]'
  }

  return 'bg-[var(--status-running)]'
})

function isSettling(pod: Pod): boolean {
  if (pod.phase === 'Pending' || pod.phase === 'Terminating') {
    return true
  }

  return pod.phase === 'Running' && !pod.ready
}

function podTitle(pod: Pod): string {
  const restarts = pod.restarts > 0 ? ` · ${pod.restarts} restarts` : ''

  return `${pod.name} · ${getPodStateLabel(pod.phase, pod.ready)}${restarts}`
}
</script>
