<template>
  <USidebar
    v-model:open="open"
    side="right"
    collapsible="offcanvas"
    variant="sidebar"
    :ui="{
      root: '[--sidebar-width:25rem]',
      header: 'hidden',
      gap: 'h-full',
      body: 'p-0',
      container: 'absolute inset-y-0 h-full'
    }"
  >
    <div v-if="workload" class="flex h-full min-h-0 w-full flex-col overflow-hidden">
      <div class="shrink-0 space-y-2.5 border-b border-default p-3.5">
        <div class="flex items-center justify-between gap-2">
          <p class="text-[10px] font-medium uppercase tracking-wide text-dimmed">
            Workload details
          </p>

          <UButton
            icon="i-lucide-x"
            color="neutral"
            variant="ghost"
            size="xs"
            aria-label="Close workload details"
            @click="open = false"
          />
        </div>

        <div class="min-w-0">
          <p
            class="truncate font-mono text-[12px] font-semibold text-highlighted"
            :title="workload.name"
          >
            {{ workload.name }}
          </p>

          <p class="mt-0.5 truncate text-[10px] text-dimmed">
            {{ workload.namespace }} · {{ workload.kind }} · {{ readyCount }}/{{ workload.pods.length }} ready
          </p>
        </div>
      </div>

      <div class="flex min-h-0 flex-1 flex-col overflow-hidden p-3">
        <UTabs
          v-model="activeTab"
          :items="TABS"
          :content="false"
          size="xs"
          variant="link"
          color="info"
          class="mb-3 shrink-0"
          :ui="{ trigger: 'grow' }"
        />

        <div class="min-h-0 flex-1 overflow-y-auto kv-scroll">
          <WorkloadPanelOverview
            v-if="activeTab === 'overview'"
            :workload="workload"
            @select="clusterStore.focusPod($event)"
          />

          <WorkloadPanelYaml v-else :workload="workload" />
        </div>
      </div>
    </div>
  </USidebar>
</template>

<script setup lang="ts">
import { getWorkloadKey, getWorkloadKind, getWorkloadName } from '~/utils/format'

const clusterStore = useClusterStore()

const TABS = [
  { label: 'Overview', icon: 'i-lucide-layout-panel-left', value: 'overview' },
  { label: 'YAML', icon: 'i-lucide-file-code', value: 'yaml' },
]

const activeTab = ref('overview')

const workload = computed(() => {
  const key = clusterStore.selectedWorkload

  if (!key) {
    return null
  }

  const pods = clusterStore.podList.filter(
    pod => getWorkloadKey(pod) === key,
  )

  const first = pods[0]

  if (!first) {
    return null
  }

  return {
    key,
    name: getWorkloadName(first),
    namespace: first.namespace,
    kind: getWorkloadKind(first.workload),
    apiKind: first.workload?.split('/')[0] ?? 'Pod',
    pods,
  }
})

const open = computed({
  get: () => workload.value !== null,
  set: (value: boolean) => {
    if (!value) {
      clusterStore.selectWorkload(null)
    }
  },
})

const readyCount = computed(() =>
  workload.value?.pods.filter(pod => pod.ready).length ?? 0,
)

watch(() => clusterStore.selectedWorkload, () => {
  activeTab.value = 'overview'
})
</script>
