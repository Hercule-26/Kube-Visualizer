<template>
  <USidebar
    v-model:open="open"
    side="right"
    collapsible="offcanvas"
    variant="sidebar"
    :ui="{
      header: 'hidden',
      gap: 'h-full',
      body: 'p-0',
      container: 'absolute inset-y-0'
    }"
  >
    <div class="flex h-full min-h-0 w-full flex-col overflow-hidden">
      <div class="shrink-0 space-y-1.5 border-b border-default p-3">
        <div class="flex items-center justify-between gap-2">
          <p class="text-[10px] font-medium uppercase tracking-wide text-dimmed">
            Pod details
          </p>

          <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="xs" aria-label="Close pod details"
            @click="open = false" />
        </div>

        <div v-if="pod" class="flex min-w-0 items-center gap-2">
          <span class="size-2 shrink-0 rounded-full" :class="getPodStateColor(pod.phase)" />

          <span class="truncate font-mono text-[11px] font-medium text-highlighted">
            {{ pod.name }}
          </span>
        </div>

        <p v-else class="text-xs text-dimmed">
          No pod selected.
        </p>
      </div>

      <div class="min-h-0 flex-1 overflow-y-auto kv-scroll">
        <div v-if="!pod" class="px-3 py-8 text-center">
          <UIcon name="i-lucide-box" class="mx-auto size-7 text-dimmed" />

          <p class="mt-2 text-xs text-dimmed">
            Select a pod to see its details.
          </p>
        </div>

        <div v-else class="space-y-4 p-3">
          <section>
            <p class="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-dimmed">
              Status
            </p>

            <div class="grid grid-cols-2 gap-1.5">
              <div class="rounded-md border border-default bg-elevated/50 px-2.5 py-2">
                <p class="text-[9px] text-dimmed">
                  Phase
                </p>

                <div class="mt-1 flex items-center gap-1.5">
                  <span class="size-2 shrink-0 rounded-full" :class="getPodStateColor(pod.phase)" />

                  <span class="truncate font-mono text-[10px] font-medium text-highlighted">
                    {{ pod.phase }}
                  </span>
                </div>
              </div>

              <!-- Ready -->
              <div class="rounded-md border border-default bg-elevated/50 px-2.5 py-2">
                <p class="text-[9px] text-dimmed">
                  Ready
                </p>

                <div class="mt-1 flex items-center gap-1.5">
                  <span class="size-2 shrink-0 rounded-full" :class="pod.ready
                      ? 'bg-success'
                      : 'bg-error'
                    " />

                  <span class="font-mono text-[10px] font-medium" :class="pod.ready
                      ? 'text-success'
                      : 'text-error'
                    ">
                    {{ pod.ready ? 'Ready' : 'Not ready' }}
                  </span>
                </div>
              </div>
            </div>

            <div
              class="mt-1.5 flex items-center justify-between rounded-md border border-default bg-elevated/50 px-2.5 py-2">
              <span class="text-[10px] text-dimmed">
                Restarts
              </span>

              <span class="font-mono text-[10px] font-medium" :class="pod.restarts > 0
                  ? 'text-warning'
                  : 'text-highlighted'
                ">
                {{ pod.restarts }}
              </span>
            </div>
          </section>

          <USeparator />

          <section>
            <p class="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-dimmed">
              Identity
            </p>

            <div class="space-y-2">
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
            <p class="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-dimmed">
              Workload
            </p>

            <div class="flex min-w-0 justify-between gap-3">
              <span class="shrink-0 text-[10px] text-dimmed">
                Owner
              </span>

              <span v-if="pod.workload" class="truncate text-right font-mono text-[10px] text-muted"
                :title="pod.workload">
                {{ pod.workload }}
              </span>

              <span v-else class="text-[10px] italic text-dimmed">
                None
              </span>
            </div>
          </section>

          <USeparator />

          <section>
            <p class="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-dimmed">
              Scheduling
            </p>

            <div class="flex min-w-0 justify-between gap-3">
              <span class="shrink-0 text-[10px] text-dimmed">
                Node
              </span>

              <span v-if="pod.node" class="truncate text-right font-mono text-[10px] text-muted" :title="pod.node">
                {{ pod.node }}
              </span>

              <span v-else class="text-[10px] italic text-dimmed">
                Unscheduled
              </span>
            </div>
          </section>

          <USeparator />

          <section>
            <p class="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-dimmed">
              Timestamps
            </p>

            <div class="space-y-2">
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

                <span v-if="pod.startedAt" class="truncate text-right font-mono text-[9px] text-muted"
                  :title="pod.startedAt">
                  {{ formatDate(pod.startedAt) }}
                </span>

                <span v-else class="text-[10px] italic text-dimmed">
                  Not started
                </span>
              </div>
            </div>
          </section>

          <USeparator />

          <section>
            <p class="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-dimmed">
              Actions
            </p>

            <div class="flex gap-1.5">
              <UButton icon="i-lucide-file-text" color="neutral" variant="subtle" size="xs" class="flex-1">
                Logs
              </UButton>

              <UButton icon="i-lucide-terminal" color="neutral" variant="subtle" size="xs" class="flex-1">
                Terminal
              </UButton>
            </div>
          </section>
        </div>
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
</script>
