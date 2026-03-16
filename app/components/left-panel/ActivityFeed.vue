<template>
  <section
    class="min-h-0 flex flex-col border-t border-default"
    :class="activityOpen ? 'flex-1' : 'shrink-0'"
  >
    <button
      type="button"
      class="flex w-full shrink-0 items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-elevated"
      @click="toggleActivity"
    >
      <UIcon
        :name="
          activityOpen
            ? 'i-lucide-chevron-up'
            : 'i-lucide-chevron-down'
        "
        class="size-3.5 shrink-0 text-dimmed"
      />

      <span
        class="text-[10px] font-medium uppercase tracking-wide text-dimmed"
      >
        Activity
      </span>

      <span class="text-[10px] tabular-nums text-muted">
        · {{ clusterStore.activities.length }}
      </span>

      <div
        v-if="!activityOpen && unreadActivities > 0"
        class="ml-auto flex items-center gap-1"
      >
        <span
          v-if="activityUnreadByType.error"
          class="inline-flex min-w-4 items-center justify-center rounded-full bg-error/15 px-1.5 py-0.5 text-[9px] font-medium tabular-nums text-error"
        >
          {{ activityUnreadByType.error }}
        </span>

        <span
          v-if="activityUnreadByType.warning"
          class="inline-flex min-w-4 items-center justify-center rounded-full bg-warning/15 px-1.5 py-0.5 text-[9px] font-medium tabular-nums text-warning"
        >
          {{ activityUnreadByType.warning }}
        </span>

        <span
          v-if="activityUnreadByType.info"
          class="inline-flex min-w-4 items-center justify-center rounded-full bg-info/15 px-1.5 py-0.5 text-[9px] font-medium tabular-nums text-info"
        >
          {{ activityUnreadByType.info }}
        </span>

        <span
          v-if="activityUnreadByType.success"
          class="inline-flex min-w-4 items-center justify-center rounded-full bg-success/15 px-1.5 py-0.5 text-[9px] font-medium tabular-nums text-success"
        >
          {{ activityUnreadByType.success }}
        </span>
      </div>
    </button>

    <div
      v-if="activityOpen"
      class="min-h-0 flex-1 overflow-y-auto kv-scroll"
    >
      <ul class="space-y-1.5 px-2 py-2">
        <li
          v-for="activity in clusterStore.activities"
          :key="activity.id"
          class="relative flex items-start gap-2 overflow-hidden rounded-lg border border-default bg-elevated/35 py-2 pl-3 pr-2 transition-colors hover:bg-elevated"
        >
          <span
            class="absolute inset-y-0 left-0 w-0.5"
            :class="getActivityStyle(activity.type).bar"
          />

          <div
            class="flex size-6 shrink-0 items-center justify-center rounded-md"
            :class="getActivityStyle(activity.type).background"
          >
            <UIcon
              :name="getActivityStyle(activity.type).icon"
              class="size-3"
              :class="getActivityStyle(activity.type).text"
            />
          </div>

          <div class="min-w-0 flex-1">
            <div class="flex items-start justify-between gap-2">
              <p class="line-clamp-2 min-w-0 text-[10px] font-medium leading-4 text-highlighted">
                {{ activity.message }}
              </p>

              <span
                class="shrink-0 pt-0.5 font-mono text-[9px] text-dimmed"
                :title="formatDate(activity.timestamp)"
              >
                {{ formatRelativeTime(activity.timestamp, now) }}
              </span>
            </div>

            <div class="mt-1 flex min-w-0 items-center gap-1.5">
              <span
                class="rounded px-1 py-0.5 text-[8px] font-medium"
                :class="[getActivityStyle(activity.type).background, getActivityStyle(activity.type).text]"
              >
                {{ getActivityStyle(activity.type).label }}
              </span>

              <span
                v-if="activity.resource"
                class="flex min-w-0 items-center gap-1 text-[8px] text-muted"
              >
                <UIcon :name="getResourceIcon(activity.resource)" class="size-2.5 shrink-0" />
                <span class="truncate font-mono">{{ activity.resource }}</span>
              </span>
            </div>
          </div>
        </li>
      </ul>

      <div
        v-if="clusterStore.activities.length === 0"
        class="px-3 py-8 text-center"
      >
        <UIcon
          name="i-lucide-activity"
          class="mx-auto size-6 text-dimmed"
        />

        <p class="mt-2 text-xs text-dimmed">
          No cluster activity yet.
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { ClusterActivityType } from '#shared/types/cluster'

const clusterStore = useClusterStore()

const activityOpen = ref(true)

const now = ref(Date.now())

let clockTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  clockTimer = setInterval(() => {
    now.value = Date.now()
  }, 15000)
})

onUnmounted(() => {
  if (clockTimer) {
    clearInterval(clockTimer)
  }
})

const lastSeenActivityId = ref<string | null>(
  clusterStore.activities[0]?.id ?? null
)

const activityUnreadByType = computed(() => {
  const counts: Record<ClusterActivityType, number> = {
    info: 0,
    success: 0,
    warning: 0,
    error: 0
  }

  if (activityOpen.value || !lastSeenActivityId.value) {
    return counts
  }

  for (const activity of clusterStore.activities) {
    if (activity.id === lastSeenActivityId.value) {
      break
    }

    counts[activity.type]++
  }

  return counts
})

const unreadActivities = computed(() =>
  Object.values(activityUnreadByType.value).reduce(
    (total, count) => total + count,
    0
  )
)

function getActivityStyle(type: ClusterActivityType): {
  label: string
  icon: string
  background: string
  text: string
  bar: string
} {
  switch (type) {
    case 'error':
      return {
        label: 'Error',
        icon: 'i-lucide-circle-x',
        background: 'bg-error/12',
        text: 'text-error',
        bar: 'bg-error',
      }
    case 'warning':
      return {
        label: 'Warning',
        icon: 'i-lucide-triangle-alert',
        background: 'bg-warning/12',
        text: 'text-warning',
        bar: 'bg-warning',
      }
    case 'success':
      return {
        label: 'Created',
        icon: 'i-lucide-circle-check',
        background: 'bg-success/12',
        text: 'text-success',
        bar: 'bg-success',
      }
    case 'info':
    default:
      return {
        label: 'Updated',
        icon: 'i-lucide-refresh-cw',
        background: 'bg-info/12',
        text: 'text-info',
        bar: 'bg-info',
      }
  }
}

function getResourceIcon(resource: string): string {
  if (resource.startsWith('Pod/')) {
    return 'i-lucide-box'
  }

  if (resource.startsWith('Node/')) {
    return 'i-lucide-server'
  }

  return 'i-lucide-boxes'
}

function toggleActivity(): void {
  activityOpen.value = !activityOpen.value

  if (activityOpen.value) {
    lastSeenActivityId.value =
      clusterStore.activities[0]?.id ?? null
  }
}
</script>
