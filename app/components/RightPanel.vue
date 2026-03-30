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
    <div class="flex h-full min-h-0 w-full flex-col overflow-hidden">
      <RightPanelHeader @close="open = false" />

      <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div v-if="!pod" class="px-3 py-8 text-center">
          <UIcon name="i-lucide-box" class="mx-auto size-7 text-dimmed" />

          <p class="mt-2 text-xs text-dimmed">
            Select a pod to see its details.
          </p>
        </div>

        <UTabs
          v-else
          v-model="activeTab"
          :items="TABS"
          size="xs"
          variant="link"
          color="info"
          class="min-h-0 flex-1 p-3"
          :ui="{ list: 'justify-between', content: 'flex min-h-0 flex-1 flex-col' }"
        >
          <template #overview>
            <RightPanelOverview />
          </template>

          <template #metrics>
            <div class="px-3 py-8 text-center">
              <UIcon name="i-lucide-gauge" class="mx-auto size-7 text-dimmed" />

              <p class="mt-2 text-xs text-dimmed">
                {{
                  clusterStore.metricsAvailable
                    ? "Metrics aren't available yet."
                    : 'metrics-server is not installed on this cluster.'
                }}
              </p>
            </div>
          </template>

          <template #logs>
            <RightPanelLogs :active="open && activeTab === 'logs'" />
          </template>

          <template #yaml>
            <RightPanelYaml />
          </template>
        </UTabs>
      </div>
    </div>
  </USidebar>
</template>

<script setup lang="ts">
const open = defineModel<boolean>('open', {
  default: false
})

const clusterStore = useClusterStore()

const pod = computed(() => clusterStore.selectedPod)

const TABS = [
  { label: 'Overview', icon: 'i-lucide-layout-panel-left', value: 'overview', slot: 'overview' },
  { label: 'Metrics', icon: 'i-lucide-gauge', value: 'metrics', slot: 'metrics' },
  { label: 'Logs', icon: 'i-lucide-file-text', value: 'logs', slot: 'logs' },
  { label: 'YAML', icon: 'i-lucide-file-code', value: 'yaml', slot: 'yaml' },
]

const activeTab = ref('overview')

watch(
  () => pod.value?.uid,
  () => {
    activeTab.value = 'overview'
  }
)
</script>
