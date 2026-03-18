<template>
  <USidebar
    v-model:open="open"
    side="right"
    collapsible="offcanvas"
    variant="sidebar"
    :ui="{
      root: '[--sidebar-width:18rem]',
      header: 'hidden',
      gap: 'h-full',
      body: 'p-0',
      container: 'absolute inset-y-0'
    }"
  >
    <div class="flex h-full min-h-0 w-full flex-col overflow-hidden">
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
            @click="open = false"
          />
        </div>

        <div v-if="pod" class="flex min-w-0 items-center gap-2.5">
          <span class="relative flex size-2.5 shrink-0">
            <span
              class="absolute inline-flex size-full rounded-full opacity-40"
              :class="getPodStateColor(pod.phase)"
            />
            <span
              class="relative inline-flex size-2.5 rounded-full ring-2 ring-default"
              :class="getPodStateColor(pod.phase)"
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

      <div class="min-h-0 flex-1 overflow-y-auto kv-scroll">
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
          class="p-3"
          :ui="{ list: 'justify-between' }"
        >
          <template #overview>
            <div class="space-y-4 pt-3">
              <section>
                <p class="mb-1.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-dimmed">
                  <UIcon name="i-lucide-activity" class="size-3" />
                  Status
                </p>

                <div class="grid grid-cols-2 gap-1.5">
                  <div class="relative overflow-hidden rounded-lg border border-default bg-elevated/50 py-2 pl-3 pr-2.5">
                    <span
                      class="absolute inset-y-0 left-0 w-0.5"
                      :class="getPodStateColor(pod.phase)"
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

                <div class="mt-1.5 flex items-center justify-between rounded-lg border border-default bg-elevated/50 px-3 py-2">
                  <span class="flex items-center gap-1.5 text-[10px] text-dimmed">
                    <UIcon name="i-lucide-rotate-cw" class="size-3" />
                    Restarts
                  </span>

                  <span
                    class="font-mono text-[11px] font-semibold"
                    :class="pod.restarts > 0 ? 'text-warning' : 'text-highlighted'"
                  >
                    {{ pod.restarts }}
                  </span>
                </div>
              </section>

              <USeparator />

              <section>
                <p class="mb-1.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-dimmed">
                  <UIcon name="i-lucide-fingerprint" class="size-3" />
                  Identity
                </p>

                <div class="space-y-2 rounded-lg border border-default bg-elevated/50 px-3 py-2.5">
                  <div class="flex min-w-0 justify-between gap-3">
                    <span class="shrink-0 text-[10px] text-dimmed">
                      Name
                    </span>

                    <span class="truncate text-right font-mono text-[10px] text-muted" :title="pod.name">
                      {{ pod.name }}
                    </span>
                  </div>

                  <div class="flex min-w-0 justify-between gap-3">
                    <span class="shrink-0 text-[10px] text-dimmed">
                      Namespace
                    </span>

                    <span class="truncate text-right font-mono text-[10px] text-muted" :title="pod.namespace">
                      {{ pod.namespace }}
                    </span>
                  </div>

                  <div class="flex min-w-0 justify-between gap-3">
                    <span class="shrink-0 text-[10px] text-dimmed">
                      UID
                    </span>

                    <span class="min-w-0 truncate text-right font-mono text-[9px] text-muted" :title="pod.uid">
                      {{ pod.uid }}
                    </span>
                  </div>
                </div>
              </section>

              <USeparator />

              <section>
                <p class="mb-1.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-dimmed">
                  <UIcon name="i-lucide-layers" class="size-3" />
                  Workload
                </p>

                <div class="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-default bg-elevated/50 px-3 py-2.5">
                  <span class="shrink-0 text-[10px] text-dimmed">
                    Owner
                  </span>

                  <span
                    v-if="pod.workload"
                    class="truncate text-right font-mono text-[10px] text-muted"
                    :title="pod.workload"
                  >
                    {{ pod.workload }}
                  </span>

                  <span v-else class="text-[10px] italic text-dimmed">
                    None
                  </span>
                </div>
              </section>

              <USeparator />

              <section>
                <p class="mb-1.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-dimmed">
                  <UIcon name="i-lucide-server" class="size-3" />
                  Scheduling
                </p>

                <div class="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-default bg-elevated/50 px-3 py-2.5">
                  <span class="shrink-0 text-[10px] text-dimmed">
                    Node
                  </span>

                  <span
                    v-if="pod.node"
                    class="truncate text-right font-mono text-[10px] text-muted"
                    :title="pod.node"
                  >
                    {{ pod.node }}
                  </span>

                  <span v-else class="text-[10px] italic text-dimmed">
                    Unscheduled
                  </span>
                </div>
              </section>

              <USeparator />

              <section>
                <p class="mb-1.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-dimmed">
                  <UIcon name="i-lucide-clock" class="size-3" />
                  Timestamps
                </p>

                <div class="space-y-2 rounded-lg border border-default bg-elevated/50 px-3 py-2.5">
                  <div class="flex min-w-0 justify-between gap-3">
                    <span class="shrink-0 text-[10px] text-dimmed">
                      Created
                    </span>

                    <span class="truncate text-right font-mono text-[9px] text-muted" :title="pod.createdAt">
                      {{ formatDate(pod.createdAt) }}
                    </span>
                  </div>

                  <div class="flex min-w-0 justify-between gap-3">
                    <span class="shrink-0 text-[10px] text-dimmed">
                      Started
                    </span>

                    <span
                      v-if="pod.startedAt"
                      class="truncate text-right font-mono text-[9px] text-muted"
                      :title="pod.startedAt"
                    >
                      {{ formatDate(pod.startedAt) }}
                    </span>

                    <span v-else class="text-[10px] italic text-dimmed">
                      Not started
                    </span>
                  </div>
                </div>
              </section>
            </div>
          </template>

          <template #metrics>
            <div class="px-3 py-8 text-center">
              <UIcon name="i-lucide-gauge" class="mx-auto size-7 text-dimmed" />

              <p class="mt-2 text-xs text-dimmed">
                Metrics aren't available yet.
              </p>
            </div>
          </template>

          <template #logs>
            <div class="px-3 py-8 text-center">
              <UIcon name="i-lucide-file-text" class="mx-auto size-7 text-dimmed" />

              <p class="mt-2 text-xs text-dimmed">
                Logs aren't available yet.
              </p>
            </div>
          </template>
        </UTabs>
      </div>
    </div>
  </USidebar>
</template>

<script setup lang="ts">
import { getPodStateColor } from '~/utils/format'

const open = defineModel<boolean>('open', {
  default: false
})

const clusterStore = useClusterStore()

const pod = computed(() =>
  clusterStore.selectedPodDetails ?? clusterStore.selectedPod,
)

const TABS = [
  { label: 'Overview', icon: 'i-lucide-layout-panel-left', value: 'overview', slot: 'overview' },
  { label: 'Metrics', icon: 'i-lucide-gauge', value: 'metrics', slot: 'metrics' },
  { label: 'Logs', icon: 'i-lucide-file-text', value: 'logs', slot: 'logs' },
]

const activeTab = ref('overview')

watch(
  () => pod.value?.uid,
  () => {
    activeTab.value = 'overview'
  }
)
</script>
