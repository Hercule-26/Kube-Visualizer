<template>
  <div class="min-h-0 flex-1 overflow-hidden pt-3">
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
      class="h-full overflow-auto rounded-lg border border-default bg-elevated/50 p-3 font-mono text-[10px] leading-relaxed text-muted kv-scroll"
    >{{ yaml }}</pre>
  </div>
</template>

<script setup lang="ts">
const clusterStore = useClusterStore()

const yaml = ref('')
const error = ref('')
const pending = ref(false)

async function loadYaml(): Promise<void> {
  const clusterId = clusterStore.currentCluster?.id
  const uid = clusterStore.selectedPod?.uid

  if (!clusterId || !uid) {
    return
  }

  pending.value = true
  yaml.value = ''
  error.value = ''

  try {
    const response = await $fetch<{ yaml: string }>(
      `/api/clusters/${clusterId}/pods/${uid}/yaml`,
    )

    yaml.value = response.yaml
  }
  catch (err: any) {
    error.value = err?.data?.statusMessage ?? 'The pod manifest could not be read.'
  }
  finally {
    pending.value = false
  }
}

onMounted(loadYaml)

watch(() => clusterStore.selectedPod?.uid, loadYaml)
</script>
