<template>
  <div class="pb-4">
    <div v-if="pending" class="flex items-center gap-2 py-8 text-[10px] text-dimmed">
      <UIcon name="i-lucide-loader-circle" class="size-3.5 animate-spin" />
      Loading manifest…
    </div>

    <UAlert
      v-else-if="error"
      color="warning"
      variant="subtle"
      icon="i-lucide-triangle-alert"
      :description="error"
      :ui="{ description: 'text-[11px]' }"
    />

    <pre
      v-else
      class="overflow-auto rounded-lg border border-default bg-elevated/50 p-3 font-mono text-[10px] leading-relaxed text-muted kv-scroll"
    >{{ yaml }}</pre>
  </div>
</template>

<script setup lang="ts">
import type { Workload } from '~/utils/workload'

const props = defineProps<{
  workload: Workload
}>()

const clusterStore = useClusterStore()

const yaml = ref('')
const error = ref('')
const pending = ref(false)

async function loadYaml(): Promise<void> {
  const clusterId = clusterStore.currentCluster?.id
  const kind = props.workload.apiKind

  if (!clusterId) {
    return
  }

  pending.value = true
  yaml.value = ''
  error.value = ''

  try {
    const response = await $fetch<{ yaml: string }>(
      `/api/clusters/${clusterId}/workloads/${kind}/${props.workload.namespace}/${props.workload.name}`,
    )

    yaml.value = response.yaml
  }
  catch (err: any) {
    error.value = err?.data?.statusMessage
      ?? `${kind} manifests cannot be read here.`
  }
  finally {
    pending.value = false
  }
}

onMounted(loadYaml)

watch(() => props.workload.key, loadYaml)
</script>
