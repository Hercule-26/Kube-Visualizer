<template>
  <USidebar
    v-model:open="open"
    side="left"
    collapsible="offcanvas"
    variant="sidebar"
    :ui="{
      header: 'hidden',
      gap: 'h-[calc(100%-var(--ui-header-height))]',
      container: 'absolute top-(--ui-header-height) bottom-0 h-[calc(100%-var(--ui-header-height))]'
    }"
  >
    <UNavigationMenu
      :items="items"
      orientation="vertical"
    />
  </USidebar>
</template>

<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const open = ref(true)

const items: NavigationMenuItem[] = [
  {
    label: 'Resources',
    icon: 'i-lucide-box'
  },
  {
    label: 'Status',
    icon: 'i-lucide-activity'
  }
]
</script>