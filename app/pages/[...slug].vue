<template>
  <div class="flex h-full items-center justify-center p-6">
    <div class="text-center">
      <UIcon name="i-lucide-compass" class="mx-auto size-8 text-dimmed" />

      <p class="mt-2 text-sm font-medium text-highlighted">
        Page not found
      </p>

      <p class="mt-1 text-xs text-dimmed">
        {{ route.path }} does not exist.
      </p>

      <UButton
        to="/"
        color="neutral"
        variant="subtle"
        size="xs"
        class="mt-4"
      >
        Back to the graph
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()

setResponseStatus(useRequestEvent(), 404)
</script>
