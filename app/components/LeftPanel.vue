<template>
  <USidebar
    v-model:open="open"
    side="left"
    collapsible="offcanvas"
    variant="sidebar"
    :ui="{
      header: 'hidden',
      gap: 'h-[calc(100%-var(--ui-header-height))]',
      body: 'p-0',
      container:
        'absolute top-(--ui-header-height) bottom-0 h-[calc(100%-var(--ui-header-height))]'
    }"
  >
    <div class="flex h-full min-h-0 w-full flex-col">
      <div class="space-y-3 p-3">
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
            class="w-full hover:cursor-pointer"
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
            class="w-full cursor-pointer"
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
              class="group rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all duration-150 hover:cursor-pointer"
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

      <USeparator class="w-full shrink-0" />

      <div class="min-h-0 flex-1 kv-scroll">
        <p
          class="sticky top-0 z-10 bg-default/95 px-3 py-1.5 text-[10px] font-medium uppercase tracking-wide text-dimmed backdrop-blur"
        >
          Pod{{ clusterStore.visiblePods.length > 1 ? 's' : '' }}
          ·
          {{ clusterStore.visiblePods.length }}
        </p>

        <div class="px-3 max-h-50 overflow-y-scroll kv-scroll">
          <ul>
            <li
              v-for="pod in sortedPods"
              :key="pod.uid"
              class="border-b border-default last:border-none"
            >
              <UButton
                type="button"
                color="neutral"
                variant="ghost"
                block
                class="w-full rounded-md px-3 py-2 text-left hover:cursor-pointer"
                :class="
                  clusterStore.selectedPod?.uid === pod.uid
                    ? 'bg-elevated'
                    : 'hover:bg-elevated'
                "
                @click="selectPod(pod.uid)"
              >
                <div class="flex w-full min-w-0 items-center gap-2">
                  <span
                    class="size-2 shrink-0 rounded-full"
                    :class="getPodStateColor(pod.phase)"
                  />

                  <div class="min-w-0 flex-1">
                    <div
                      class="truncate font-mono text-[11px] font-medium text-highlighted"
                    >
                      {{ pod.name }}
                    </div>

                    <div class="mt-0.5 flex min-w-0 justify-between gap-2">
                      <span class="truncate text-[10px] text-dimmed">
                        {{ pod.namespace }}
                      </span>

                      
                      <span
                        class="truncate text-[10px] text-muted"
                      >
                        {{ pod.node ?? 'unscheduled' }}
                      </span>
                     
                    </div>
                  </div>

                  <span
                    v-if="pod.restarts > 0"
                    class="shrink-0 font-mono text-[10px] text-dimmed"
                  >
                    ×{{ pod.restarts }}
                  </span>
                </div>
              </UButton>
            </li>
          </ul>

          <p
            v-if="sortedPods.length === 0"
            class="px-3 py-6 text-center text-xs text-dimmed"
          >
            No pod matches these filters.
          </p>
        </div>
      </div>
    </div>
  </USidebar>
</template>

<script setup lang="ts">
import type { PodPhase } from '#shared/types/cluster'
import { getPodStateColor } from '~/utils/format'

const emit = defineEmits<{ focusPod: [uid: string] }>()

const open = defineModel<boolean>('open', {
  default: true
})

const clusterStore = useClusterStore()

const PHASES: PodPhase[] = [
  'Running',
  'Pending',
  'CrashLoopBackOff',
  'Failed',
  'Terminating',
  'Succeeded'
]

const namespaceOptions = computed(() => clusterStore.namespaceList)

const nodeOptions = computed(() =>
  clusterStore.nodeList.map(node => node.name)
)

function togglePhase(phase: PodPhase): void {
  const list = clusterStore.filters.phases
  const index = list.indexOf(phase)

  if (index >= 0) {
    clusterStore.filters.phases = list.filter(value => value !== phase)
  } else {
    clusterStore.filters.phases = [...list, phase]
  }
}

const phaseCounts = computed(() => {
  const counts: Partial<Record<PodPhase, number>> = {}

  for (const pod of clusterStore.podList) {
    counts[pod.phase] = (counts[pod.phase] ?? 0) + 1
  }

  return counts
})

const sortedPods = computed(() => {
  const rank: Record<string, number> = {
    CrashLoopBackOff: 0,
    Failed: 1,
    Pending: 2,
    Terminating: 3,
    Unknown: 4,
    Running: 5,
    Succeeded: 6
  }

  return [...clusterStore.visiblePods]
    .sort((a, b) => {
      const byPhase = (rank[a.phase] ?? 9) - (rank[b.phase] ?? 9)

      if (byPhase !== 0)
        return byPhase

      if (a.restarts !== b.restarts)
        return b.restarts - a.restarts

      return a.name.localeCompare(b.name)
    })
    .slice(0, 300)
})

function selectPod(uid: string): void {
  emit('focusPod', uid)
}
</script>

<style scoped lang="css">
.kv-scroll {
  scrollbar-color: #142144 transparent;
  
}

.kv-scroll::-webkit-scrollbar {
  width: 6px;
}

.kv-scroll::-webkit-scrollbar-thumb {
  background: #142144;
}

/* Light mode */
html:not(.dark) .kv-scroll {
  scrollbar-color: #67676861 transparent;
}

html:not(.dark) .kv-scroll::-webkit-scrollbar-thumb {
  background: #67676861;
}
</style>