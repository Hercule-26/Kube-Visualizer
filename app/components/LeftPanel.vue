<template>
  <USidebar
    v-model:open="open"
    side="left"
    collapsible="offcanvas"
    variant="sidebar"
    :ui="{
      header: 'hidden',
      gap: 'h-full',
      body: 'p-0',
    }"
  >
    <div class="flex h-full min-h-0 w-full flex-col overflow-hidden">
      <LeftPanelFilters />

      <USeparator class="w-full shrink-0" />

      <div class="min-h-0 flex-1 flex flex-col overflow-hidden">
        <LeftPanelPodList @focus-pod="uid => emit('focusPod', uid)" />
        <LeftPanelActivityFeed />
      </div>
    </div>
  </USidebar>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  focusPod: [uid: string]
}>()

const open = defineModel<boolean>('open', {
  default: true
})
</script>
