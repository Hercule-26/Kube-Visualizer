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

<script setup lang="ts">
import { getPodStateColor } from '~/utils/format'

const clusterStore = useClusterStore()

const pod = computed(() =>
  clusterStore.selectedPodDetails ?? clusterStore.selectedPod,
)
</script>
