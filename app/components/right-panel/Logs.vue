<template>
  <div class="flex min-h-0 flex-1 flex-col pt-3">
    <div class="mb-1.5 flex shrink-0 items-center justify-between gap-2">
      <p class="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-dimmed">
        <UIcon name="i-lucide-file-text" class="size-3" />
        Live logs
      </p>

      <div class="flex items-center gap-1.5">
        <span
          v-if="logStreaming"
          class="flex items-center gap-1.5 text-[9px] text-success"
        >
          <span class="size-1.5 shrink-0 animate-pulse rounded-full bg-success" />
          Streaming
        </span>

        <UButton
          icon="i-lucide-maximize-2"
          color="neutral"
          variant="ghost"
          size="xs"
          aria-label="Open logs in a larger view"
          @click="expanded = true"
        />
      </div>
    </div>

    <div
      ref="logBox"
      class="min-h-0 flex-1 overflow-auto rounded-lg border border-default bg-elevated/50 p-2.5 kv-scroll"
    >
      <p v-if="logError" class="font-mono text-[10px] leading-relaxed text-error">
        {{ logError }}
      </p>

      <p v-else-if="logLines.length === 0" class="text-[10px] italic text-dimmed">
        Waiting for output…
      </p>

      <pre
        v-else
        class="whitespace-pre-wrap break-all font-mono text-[10px] leading-relaxed text-muted"
      >{{ logText }}</pre>
    </div>

    <p class="mt-1.5 shrink-0 text-[9px] text-dimmed">
      Showing the last {{ MAX_LOG_LINES }} lines of the first container.
    </p>

    <UModal
      v-model:open="expanded"
      :title="pod?.name ?? 'Pod logs'"
      :description="pod?.namespace"
      :ui="{ content: 'sm:max-w-5xl' }"
    >
      <template #body>
        <div
          ref="modalLogBox"
          class="h-[70vh] overflow-auto rounded-lg border border-default bg-elevated/50 p-3 kv-scroll"
        >
          <p v-if="logError" class="font-mono text-xs leading-relaxed text-error">
            {{ logError }}
          </p>

          <p v-else-if="logLines.length === 0" class="text-xs italic text-dimmed">
            Waiting for output…
          </p>

          <pre
            v-else
            class="whitespace-pre-wrap break-all font-mono text-xs leading-relaxed text-muted"
          >{{ logText }}</pre>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  active: boolean
}>()

const clusterStore = useClusterStore()

const pod = computed(() =>
  clusterStore.selectedPodDetails ?? clusterStore.selectedPod,
)

const MAX_LOG_LINES = 500

const logLines = ref<string[]>([])
const logError = ref('')
const logStreaming = ref(false)
const logBox = ref<HTMLElement | null>(null)
const modalLogBox = ref<HTMLElement | null>(null)
const expanded = ref(false)

const logText = computed(() =>
  logLines.value.map(formatLogLine).join('\n'),
)

function formatLogLine(line: string): string {
  const spaceIndex = line.indexOf(' ')

  if (spaceIndex === -1) {
    return line
  }

  const stamp = line.slice(0, spaceIndex)

  if (!stamp.includes('T') || !stamp.endsWith('Z')) {
    return line
  }

  return `${formatDate(stamp)} ${line.slice(spaceIndex + 1)}`
}

let logSource: EventSource | null = null

function stopLogs(): void {
  if (logSource) {
    logSource.close()
    logSource = null
  }

  logStreaming.value = false
}

function scrollLogsToBottom(): void {
  nextTick(() => {
    if (logBox.value) {
      logBox.value.scrollTop = logBox.value.scrollHeight
    }

    if (modalLogBox.value) {
      modalLogBox.value.scrollTop = modalLogBox.value.scrollHeight
    }
  })
}

function startLogs(): void {
  stopLogs()

  logLines.value = []
  logError.value = ''

  const clusterId = clusterStore.currentCluster?.id
  const uid = pod.value?.uid

  if (!clusterId || !uid) {
    return
  }

  logSource = new EventSource(`/api/clusters/${clusterId}/pods/${uid}/logs`)
  logStreaming.value = true

  logSource.onmessage = (event) => {
    logLines.value.push(event.data)

    if (logLines.value.length > MAX_LOG_LINES) {
      logLines.value = logLines.value.slice(-MAX_LOG_LINES)
    }

    scrollLogsToBottom()
  }

  logSource.addEventListener('failed', (message) => {
    logError.value = (message as MessageEvent).data
    stopLogs()
  })

  logSource.onerror = () => {
    logError.value = 'Lost the connection to the pod logs.'
    stopLogs()
  }
}

function syncLogs(): void {
  if (props.active && pod.value) {
    startLogs()
  }
  else {
    stopLogs()
  }
}

onMounted(syncLogs)

watch([() => props.active, () => pod.value?.uid], syncLogs)

watch(expanded, (isOpen) => {
  if (isOpen) {
    scrollLogsToBottom()
  }
})

onUnmounted(stopLogs)
</script>
