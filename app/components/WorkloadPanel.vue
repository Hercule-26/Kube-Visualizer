<template>
  <USlideover
    v-model:open="open"
    :ui="{ content: 'sm:max-w-lg' }"
  >
    <template #header>
      <div v-if="workload" class="min-w-0 flex-1">
        <p class="truncate text-sm font-medium text-highlighted">
          {{ workload.name }}
        </p>

        <p class="mt-0.5 truncate text-[11px] text-dimmed">
          {{ workload.namespace }} · {{ workload.kind }} · {{ readyCount }}/{{ workload.pods.length }} ready
        </p>
      </div>
    </template>

    <template #body>
      <div v-if="workload" class="flex h-full min-h-0 flex-col">
        <UTabs
          v-model="activeTab"
          :items="TABS"
          :content="false"
          size="xs"
          color="info"
          class="mb-3 shrink-0"
          :ui="{ list: 'justify-between' }"
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
    </template>
  </USlideover>
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
      clusterStore.selectedWorkload = null
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
