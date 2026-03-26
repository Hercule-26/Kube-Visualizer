<template>
  <div class="shrink-0 space-y-3 p-3">
    <UInput
      v-model="clusterStore.filters.search"
      icon="i-lucide-search"
      placeholder="Search pod, workload, node…"
      size="sm"
      :ui="{ root: 'w-full' }"
    >
      <template v-if="clusterStore.filters.search" #trailing>
        <UButton
          icon="i-lucide-x"
          color="neutral"
          variant="link"
          size="xs"
          @click="clusterStore.filters.search = ''"
        />
      </template>
    </UInput>

    <div class="space-y-1.5">
      <p class="text-[10px] font-medium uppercase tracking-wide text-dimmed">
        Namespaces
      </p>

      <USelectMenu
        v-model="clusterStore.filters.namespaces"
        :items="namespaceOptions"
        multiple
        size="sm"
        placeholder="All namespaces"
        class="w-full"
      />
    </div>

    <div class="space-y-1.5">
      <p class="text-[10px] font-medium uppercase tracking-wide text-dimmed">
        Nodes
      </p>

      <USelectMenu
        v-model="clusterStore.filters.nodes"
        :items="nodeOptions"
        multiple
        size="sm"
        placeholder="All nodes"
        class="w-full"
      />
    </div>

    <div class="space-y-1.5">
      <p class="text-[10px] font-medium uppercase tracking-wide text-dimmed">
        Status
      </p>

      <div class="flex flex-wrap gap-1.5">
        <UButton
          v-for="phase in PHASES"
          :key="phase"
          type="button"
          size="xs"
          variant="ghost"
          color="neutral"
          class="group rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all duration-150"
          :class="
            clusterStore.filters.phases.includes(phase)
              ? 'border-accented bg-elevated'
              : 'border-default text-muted hover:bg-elevated'
          "
          @click="togglePhase(phase)"
        >
          <template #leading>
            <span
              class="size-2 shrink-0 rounded-full"
              :class="getPodStateColor(phase)"
            />
          </template>

          <span>{{ phase }}</span>

          <span
            class="tabular-nums"
            :class="
              clusterStore.filters.phases.includes(phase)
                ? 'text-default'
                : 'text-dimmed'
            "
          >
            {{ phaseCounts[phase] ?? 0 }}
          </span>
        </UButton>
      </div>
    </div>

    <USwitch
      v-model="clusterStore.filters.hideSystem"
      label="Hide kube-system"
      size="xs"
      color="info"
    />

    <UButton
      icon="i-lucide-filter-x"
      color="neutral"
      variant="subtle"
      size="xs"
      :disabled="!clusterStore.filtersActive"
      block
      @click="clusterStore.resetFilters()"
    >
      Clear filters
    </UButton>
  </div>
</template>

<script setup lang="ts">
import type { PodPhase } from '#shared/types/cluster'
import { POD_PHASES, getPodStateColor } from '~/utils/format'

const clusterStore = useClusterStore()

const PHASES = POD_PHASES

const namespaceOptions = computed(() => clusterStore.namespaceList)

const nodeOptions = computed(() =>
  clusterStore.nodeList.map(node => node.name)
)

const phaseCounts = computed(() => {
  const counts: Partial<Record<PodPhase, number>> = {}

  for (const pod of clusterStore.podList) {
    counts[pod.phase] = (counts[pod.phase] ?? 0) + 1
  }

  return counts
})

function togglePhase(phase: PodPhase): void {
  const list = clusterStore.filters.phases
  const index = list.indexOf(phase)

  if (index >= 0) {
    clusterStore.filters.phases = list.filter(value => value !== phase)
  } else {
    clusterStore.filters.phases = [...list, phase]
  }
}
</script>
