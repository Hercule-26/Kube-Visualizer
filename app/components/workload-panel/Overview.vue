<template>
  <div class="space-y-4 pb-4">
    <section>
      <p class="mb-1.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-dimmed">
        <UIcon name="i-lucide-container" class="size-3" />
        Container images
      </p>

      <p v-if="images.length === 0" class="text-[10px] italic text-dimmed">
        No container found.
      </p>

      <div v-else class="space-y-2 rounded-lg border border-default bg-elevated/50 px-3 py-2.5">
        <div v-for="container in images" :key="container.name">
          <p class="text-[10px] text-dimmed">
            {{ container.name }}
          </p>

          <p
            class="mt-0.5 truncate font-mono text-[10px] text-muted"
            :title="container.image"
          >
            {{ container.image }}
          </p>
        </div>
      </div>
    </section>

    <USeparator />

    <section>
      <p class="mb-1.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-dimmed">
        <UIcon name="i-lucide-box" class="size-3" />
        Pods · {{ workload.pods.length }}
      </p>

      <ul class="space-y-1.5">
        <li v-for="pod in workload.pods" :key="pod.uid">
          <button
            type="button"
            class="flex w-full items-center gap-2 rounded-lg border bg-elevated/50 px-3 py-2 text-left transition-colors hover:cursor-pointer hover:bg-elevated"
            :class="clusterStore.selectedPod?.uid === pod.uid ? 'border-info' : 'border-default'"
            @click="emit('select', pod.uid)"
          >
            <span
              class="size-2 shrink-0 rounded-full"
              :class="getPodStateColor(pod.phase, pod.ready)"
            />

            <span class="min-w-0 flex-1">
              <span class="block truncate font-mono text-[10px] font-medium text-highlighted">
                {{ pod.name }}
              </span>

              <span class="block truncate text-[9px] text-dimmed">
                {{ pod.node ?? 'unscheduled' }}
                <template v-if="pod.restarts > 0">
                  · {{ pod.restarts }} restarts
                </template>
              </span>
            </span>

            <span class="shrink-0 font-mono text-[9px] text-muted">
              {{ pod.phase }}
            </span>
          </button>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { Workload } from '~/utils/workload'
import { getPodStateColor } from '~/utils/format'

const props = defineProps<{
  workload: Workload
}>()

const emit = defineEmits<{
  select: [uid: string]
}>()

const clusterStore = useClusterStore()

const images = computed(() => {
  const first = props.workload.pods[0]

  if (!first) {
    return []
  }

  return first.containers.map(container => ({
    name: container.name,
    image: container.image,
  }))
})
</script>
