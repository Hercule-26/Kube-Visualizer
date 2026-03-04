<template>
  <UHeader
    class="w-full border-b border-default py-2 backdrop-blur"
    :ui="{
      root: 'w-full',
      container: 'w-full max-w-none'
    }"
  >
    <template #title>
      <div class="flex items-center gap-2.5">
        <div class="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <UIcon name="i-lucide-box" class="size-5 text-info" />
        </div>
        <div class="leading-tight">
          <p class="text-sm font-semibold text-highlighted">
            Kube Visualizer
          </p>
          <p class="text-[10px] text-dimmed">
            live cluster topology
          </p>
        </div>
      </div>
      <USeparator orientation="vertical" class="h-8 px-2.5" />
      <div class="flex items-center gap-2.5">
        <UDropdownMenu :items="[]" :popper="{ placement: 'bottom-start' }">
          <UButton
            color="neutral"
            variant="subtle"
            icon="i-lucide-server"
            trailing-icon="i-lucide-chevron-down"
            size="sm"
          >
          <span class="max-w-44 truncate">
            {{ clusterStore.currentCluster?.name ?? 'Select a cluster' }}
          </span>
          </UButton>
        </UDropdownMenu>
        <UBadge color="warning" variant="subtle" size="sm" class="gap-1">
          <UIcon :name="clusterStore.isLoading ? 'i-lucide-loader' : 'i-lucide-alert-triangle'" class="size-3" :class="{ 'animate-spin': clusterStore.isLoading }" />
          Reconnecting 
        </UBadge>
      </div>
    </template>

    <template #right>
      <div class="ml-auto flex items-center gap-1">
        <UButton
          icon="i-lucide-refresh-cw"
          color="neutral"
          variant="ghost"
          size="sm"
          aria-label="Refresh cluster"
          :ui="{
            leadingIcon: clusterStore.isLoading ? 'animate-spin' : ''
          }"
          @click="refreshCluster"
        />

        <UButton
          :icon="colorMode.value === 'dark' ? 'i-lucide-sun' : 'i-lucide-moon'"
          color="neutral"
          variant="ghost"
          size="sm"
          aria-label="Toggle theme"
          @click="toggleTheme"
        />
      </div>
    </template>
  </UHeader>
</template>

<script setup lang="ts">
const clusterStore = useClusterStore()
const colorMode = useColorMode()

function toggleTheme() {
  colorMode.preference =
    colorMode.value === 'dark' ? 'light' : 'dark'
}
function refreshCluster() {
  clusterStore.isLoading = true
  // Implement the logic to refresh the cluster data
  setTimeout(() => {
    clusterStore.isLoading = false
  }, 2000)
}
</script>