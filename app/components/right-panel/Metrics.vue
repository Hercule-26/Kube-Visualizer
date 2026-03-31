<template>
  <div class="space-y-3 pt-3 pb-4">
    <div v-if="!clusterStore.metricsAvailable" class="px-3 py-8 text-center">
      <UIcon name="i-lucide-gauge" class="mx-auto size-7 text-dimmed" />

      <p class="mt-2 text-xs text-dimmed">
        metrics-server is not installed on this cluster.
      </p>
    </div>

    <div v-else-if="pending" class="flex items-center gap-2 py-8 text-[10px] text-dimmed">
      <UIcon name="i-lucide-loader-circle" class="size-3.5 animate-spin" />
      Reading usage…
    </div>

    <UAlert
      v-else-if="error"
      color="warning"
      variant="subtle"
      icon="i-lucide-triangle-alert"
      :description="error"
      :ui="{ description: 'text-[11px]' }"
    />

    <template v-else-if="metrics">
      <div
        v-for="container in metrics.containers"
        :key="container.name"
        class="space-y-2 rounded-lg border border-default bg-elevated/50 px-3 py-2.5"
      >
        <p class="truncate text-[10px] font-medium text-highlighted">
          {{ container.name }}
        </p>

        <div class="flex items-baseline justify-between gap-2">
          <span class="text-[9px] text-dimmed">CPU</span>

          <span class="font-mono text-[10px] text-muted">
            {{ formatCpu(container.cpuMillicores) }}
            <template v-if="container.cpuLimitMillicores">
              / {{ formatCpu(container.cpuLimitMillicores) }}
            </template>
          </span>
        </div>

        <div class="flex items-baseline justify-between gap-2">
          <span class="text-[9px] text-dimmed">Memory</span>

          <span class="font-mono text-[10px] text-muted">
            {{ formatBytes(container.memoryBytes) }}
            <template v-if="container.memoryLimitBytes">
              / {{ formatBytes(container.memoryLimitBytes) }}
            </template>
          </span>
        </div>
      </div>

      <p class="text-[9px] leading-relaxed text-dimmed">
        Usage is a {{ windowLabel }} average published by the cluster, not a live
        value. Checked every {{ REFRESH_MS / 1000 }}s.
      </p>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { PodMetrics } from '#shared/types/cluster'
import { formatBytes, formatCpu } from '~/utils/format'

const props = defineProps<{
  active: boolean
}>()

const REFRESH_MS = 5000

const clusterStore = useClusterStore()

const metrics = ref<PodMetrics | null>(null)
const error = ref('')
const pending = ref(false)

const windowLabel = computed(() => {
  const seconds = Math.round(Number.parseFloat(metrics.value?.window ?? '0'))

  return `${seconds}s`
})

async function loadMetrics(): Promise<void> {
  const clusterId = clusterStore.currentCluster?.id
  const uid = clusterStore.selectedPod?.uid

  if (!clusterId || !uid) {
    return
  }

  pending.value = metrics.value === null
  error.value = ''

  try {
    metrics.value = await $fetch<PodMetrics>(
      `/api/clusters/${clusterId}/pods/${uid}/metrics`,
    )
  }
  catch (err: any) {
    metrics.value = null
    error.value = err?.data?.statusMessage ?? 'Usage could not be read.'
  }
  finally {
    pending.value = false
  }
}

let timer: ReturnType<typeof setInterval> | null = null

function stopRefresh(): void {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

function syncMetrics(): void {
  stopRefresh()

  if (!props.active || !clusterStore.metricsAvailable) {
    return
  }

  void loadMetrics()

  timer = setInterval(loadMetrics, REFRESH_MS)
}

onMounted(syncMetrics)

watch([() => props.active, () => clusterStore.selectedPod?.uid], () => {
  metrics.value = null
  syncMetrics()
})

onUnmounted(stopRefresh)
</script>
