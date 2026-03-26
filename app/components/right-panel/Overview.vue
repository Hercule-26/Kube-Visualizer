<template>
  <div v-if="pod" class="min-h-0 flex-1 space-y-4 overflow-y-auto pt-3 kv-scroll">
    <section>
      <p class="mb-1.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-dimmed">
        <UIcon name="i-lucide-activity" class="size-3" />
        Status
      </p>

      <div class="grid grid-cols-2 gap-1.5">
        <div class="relative overflow-hidden rounded-lg border border-default bg-elevated/50 py-2 pl-3 pr-2.5">
          <span
            class="absolute inset-y-0 left-0 w-0.5"
            :class="getPodStateColor(pod.phase, pod.ready)"
          />

          <p class="text-[9px] text-dimmed">
            Phase
          </p>

          <p class="mt-1 truncate font-mono text-[11px] font-semibold text-highlighted">
            {{ pod.phase }}
          </p>
        </div>

        <div class="relative overflow-hidden rounded-lg border border-default bg-elevated/50 py-2 pl-3 pr-2.5">
          <span
            class="absolute inset-y-0 left-0 w-0.5"
            :class="pod.ready ? 'bg-success' : 'bg-error'"
          />

          <p class="text-[9px] text-dimmed">
            Ready
          </p>

          <p
            class="mt-1 font-mono text-[11px] font-semibold"
            :class="pod.ready ? 'text-success' : 'text-error'"
          >
            {{ pod.ready ? 'Ready' : 'Not ready' }}
          </p>
        </div>
      </div>
    </section>

    <USeparator />

    <section>
      <p class="mb-2 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-dimmed">
        <UIcon name="i-lucide-info" class="size-3" />
        Details
      </p>

      <dl class="grid grid-cols-2 gap-x-4 gap-y-2.5">
        <div v-for="fact in facts" :key="fact.label" class="min-w-0">
          <dt class="text-[10px] text-dimmed">
            {{ fact.label }}
          </dt>

          <dd
            class="mt-0.5 truncate text-[11px] font-medium text-highlighted"
            :class="fact.mono ? 'font-mono' : ''"
            :title="fact.value"
          >
            {{ fact.value }}
          </dd>
        </div>
      </dl>
    </section>
  </div>
</template>

<script setup lang="ts">
import { formatAge, getPodStateColor } from '~/utils/format'

const clusterStore = useClusterStore()

const pod = computed(() => clusterStore.selectedPod)

const facts = computed(() => {
  const current = pod.value

  if (!current) {
    return []
  }

  const details = clusterStore.selectedPodDetails

  return [
    { label: 'Namespace', value: current.namespace, mono: true },
    { label: 'Node', value: current.node ?? 'unscheduled', mono: true },
    { label: 'Pod IP', value: details?.ip ?? '—', mono: true },
    { label: 'Controller', value: current.workload ?? 'standalone', mono: true },
    { label: 'QoS class', value: details?.qosClass ?? '—', mono: false },
    { label: 'Created', value: formatAge(current.createdAt), mono: true },
    { label: 'Started', value: formatAge(current.startedAt), mono: true },
    { label: 'Restarts', value: String(current.restarts), mono: true },
  ]
})
</script>
