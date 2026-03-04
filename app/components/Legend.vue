
<template>
  <UCollapsible
    v-model:open="open"
    class="pointer-events-auto max-w-62 overflow-hidden rounded-lg border border-default bg-default/90 shadow-sm backdrop-blur"
  >
    <UButton
      color="neutral"
      variant="ghost"
      block
      class="group justify-between rounded-none px-3 py-1.5 text-[11px] font-medium text-muted hover:bg-elevated"
      trailing-icon="i-lucide-chevron-down"
      :ui="{
        trailingIcon:
          'group-data-[state=open]:rotate-180 transition-transform duration-200',
      }"
    >
      <span class="flex items-center gap-1.5">
        <UIcon name="i-lucide-list" class="size-3.5" />
        Legend
      </span>
    </UButton>

    <template #content>
      <div class="space-y-2 border-t border-default px-3 py-2">
        <ul class="space-y-1">
          <li
            v-for="state in STATES"
            :key="state.phase"
            class="flex items-center gap-2 text-[10.5px]"
          >
            <span
              class="size-2.5 shrink-0 rounded-full"
              :class="state.color"
            />

            <span class="text-default">
              {{ state.label }}
            </span>

            <span class="ml-auto truncate text-dimmed">
              {{ state.hint }}
            </span>
          </li>

          <li class="flex items-center gap-2 text-[10.5px]">
            <span
              class="size-2.5 shrink-0 rounded-full border-2 border-amber-500 bg-transparent"
            />

            <span class="text-default">Restarted</span>

            <span class="ml-auto text-dimmed">
              amber ring
            </span>
          </li>
        </ul>

        <div class="border-t border-default pt-2 text-[10px] text-dimmed">
          <p>
            Drag to pan · scroll to zoom · click a pod for details ·
            double-click a card to centre it.
          </p>
        </div>
      </div>
    </template>
  </UCollapsible>
</template>

<script setup lang="ts">
const store = useClusterStore()
const open = ref(false)

const STATES = [
  {
    phase: 'Running',
    label: 'Running',
    hint: 'ready, serving traffic',
    color: 'bg-emerald-500',
  },
  {
    phase: 'Pending',
    label: 'Pending / not ready',
    hint: 'scheduling or starting',
    color: 'bg-amber-500',
  },
  {
    phase: 'CrashLoopBackOff',
    label: 'Crash / failed',
    hint: 'restarting in back-off',
    color: 'bg-red-500',
  },
  {
    phase: 'Terminating',
    label: 'Terminating',
    hint: 'being removed',
    color: 'bg-purple-500',
  },
  {
    phase: 'Succeeded',
    label: 'Succeeded',
    hint: 'completed job',
    color: 'bg-blue-500',
  },
] as const

const trafficMeasured = computed(
  () => store.capabilities?.traffic === 'measured',
)

const discovering = computed(
  () => store.capabilities?.connectionDiscovery === true,
)
</script>
