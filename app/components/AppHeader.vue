<template>
  <UHeader
    class="w-full border-b border-default py-2 backdrop-blur"
    :ui="{
      root: 'w-full',
      container: 'w-full max-w-none',
    }"
  >
    <template #title>
      <div class="flex items-center gap-2.5">
        <div class="flex size-8 items-center justify-center rounded-lg bg-info/10 text-info">
          <UIcon name="i-lucide-box" class="size-5" />
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

      <USeparator
        orientation="vertical"
        class="h-8 px-2.5"
      />

      <div class="flex items-center gap-2.5">
        <UDropdownMenu
          v-model:open="clusterMenuOpen"
          :items="clusterMenuItems"
          :popper="{ placement: 'bottom-start' }"
        >
          <UButton
            color="neutral"
            variant="subtle"
            icon="i-lucide-server"
            :trailing-icon="
              clusterMenuOpen
                ? 'i-lucide-chevron-up'
                : 'i-lucide-chevron-down'
            "
            size="sm"
          >
            <span class="max-w-44 truncate">
              {{ clusterStore.currentCluster?.name ?? 'Select a cluster' }}
            </span>
          </UButton>
        </UDropdownMenu>

        <!-- Socket status -->
        <UBadge
          :color="socketBadge.color"
          variant="subtle"
          size="sm"
          class="gap-1"
        >
          <UIcon
            :name="socketBadge.icon"
            class="size-3"
            :class="{ 'animate-spin': socketBadge.loading }"
          />

          {{ socketBadge.label }}
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
            leadingIcon: clusterStore.isLoading
              ? 'animate-spin'
              : '',
          }"
          @click="refreshCluster"
        />

        <UButton
          :icon="
            colorMode.value === 'dark'
              ? 'i-lucide-sun'
              : 'i-lucide-moon'
          "
          color="neutral"
          variant="ghost"
          size="sm"
          aria-label="Toggle theme"
          @click="toggleTheme"
        />
      </div>
    </template>

    <ConnectClusterModal
      v-model:open="openConnectionModal"
    />
  </UHeader>
</template>

<script setup lang="ts">
import ConnectClusterModal from './ConnectClusterModal.vue'

const colorMode = useColorMode()

const openConnectionModal = ref(false)
const clusterMenuOpen = ref(false)

const clusterStore = useClusterStore()
const socket = useWebSocket()

const socketBadge = computed(() => {
  switch (socket.status.value) {
    case 'connected':
      return {
        color: 'success' as const,
        icon: 'i-lucide-activity',
        label: 'Live',
        loading: false,
      }

    case 'connecting':
      return {
        color: 'info' as const,
        icon: 'i-lucide-loader-circle',
        label: 'Connecting',
        loading: true,
      }

    case 'reconnecting':
      return {
        color: 'warning' as const,
        icon: 'i-lucide-loader-circle',
        label: 'Reconnecting',
        loading: true,
      }

    default:
      return {
        color: 'error' as const,
        icon: 'i-lucide-wifi-off',
        label: 'Disconnected',
        loading: false,
      }
  }
})

const clusterMenuItems = computed(() => [
  [
    {
      label: 'Connect cluster',
      icon: 'i-lucide-plus',
      onSelect: () => {
        openConnectionModal.value = true
      },
    },
  ],
  [
    ...clusterStore.clusterList.map(cluster => ({
      label: cluster.name,
      icon: 'i-lucide-server',
      onSelect: () => {
        clusterStore.selectCluster(cluster)
      },
    })),
  ],
])

function toggleTheme() {
  colorMode.preference =
    colorMode.value === 'dark'
      ? 'light'
      : 'dark'
}

function refreshCluster() {
  clusterStore.isLoading = true

  setTimeout(() => {
    clusterStore.isLoading = false
  }, 2000)
}
</script>