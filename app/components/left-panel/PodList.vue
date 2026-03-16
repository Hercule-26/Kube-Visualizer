<template>
  <section class="min-h-0 flex-1 flex flex-col overflow-hidden">
    <p
      class="z-10 shrink-0 bg-default/95 px-3 py-1.5 text-[10px] font-medium uppercase tracking-wide text-dimmed backdrop-blur"
    >
      Pod{{ clusterStore.visiblePods.length > 1 ? 's' : '' }}
      ·
      {{ clusterStore.visiblePods.length }}
    </p>

    <div class="min-h-0 flex-1 overflow-y-auto kv-scroll">
      <div class="px-3">
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

                    <span class="truncate text-[10px] text-muted">
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
  </section>
</template>

<script setup lang="ts">
import { getPodStateColor } from '~/utils/format'

const emit = defineEmits<{
  focusPod: [uid: string]
}>()

const clusterStore = useClusterStore()

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
      const byPhase =
        (rank[a.phase] ?? 9) - (rank[b.phase] ?? 9)

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
