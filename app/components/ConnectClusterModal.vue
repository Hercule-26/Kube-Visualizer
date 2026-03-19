<script setup lang="ts">
import type { Cluster } from '~~/shared/types/cluster'

const open = defineModel<boolean>('open', { required: true })

const toast = useToast()
const clusterStore = useClusterStore()

const DEFAULTS = {
  name: '',
  server: '',
  token: '',
  certificate: '',
  insecureSkipTlsVerify: false,
}

const form = reactive({ ...DEFAULTS })

const guideOpen = ref(false)
const busy = ref<'test' | 'connect' | null>(null)
const result = ref<{ ok: boolean, message: string } | null>(null)

const canSubmit = computed(() =>
  form.name.trim() !== ''
  && form.server.trim() !== ''
  && form.token.trim() !== ''
  && (form.certificate.trim() !== '' || form.insecureSkipTlsVerify),
)

watch(open, (isOpen) => {
  if (!isOpen)
    return
  Object.assign(form, { ...DEFAULTS })
  result.value = null
})

function messageOf(err: unknown): string {
  const e = err as { data?: { statusMessage?: string }, statusMessage?: string, message?: string }
  return e.data?.statusMessage ?? e.statusMessage ?? e.message ?? 'Unknown error'
}

async function submit(dryRun: boolean): Promise<void> {
  busy.value = dryRun ? 'test' : 'connect'
  result.value = null

  try {
    const response = await $fetch<{ ok: boolean, message: string, cluster?: Cluster }>('/api/clusters', {
      method: 'POST',
      query: { dryRun },
      body: {
        name: form.name,
        server: form.server,
        token: form.token,
        certificate: form.certificate,
        insecureSkipTlsVerify: form.insecureSkipTlsVerify,
      },
    })

    result.value = {
      ok: true,
      message: response.message,
    }

    toast.add({
      title: dryRun ? 'Cluster reachable' : 'Cluster connected',
      description: response.message,
      color: 'success',
      icon: 'i-lucide-check',
    })

    if (!dryRun) {
      await clusterStore.fetchClusters()

      if (response.cluster) {
        clusterStore.selectCluster(response.cluster)
      }

      open.value = false
    }
  }
  catch (error: any) {
    result.value = {
      ok: false,
      message:
        error?.data?.statusMessage
        ?? error?.statusMessage
        ?? 'Unable to connect to the cluster.',
    }
  }
  finally {
    busy.value = null
  }
}
</script>

<template>
  <UModal v-model:open="open" title="Connect a cluster" :ui="{ content: 'sm:max-w-2xl' }">
    <template #body>
      <div class="space-y-4">
        <UAlert color="neutral" variant="subtle" icon="i-lucide-key-round"
          :ui="{ description: 'text-[11px] leading-relaxed' }"
          description="Paste a ServiceAccount token for the cluster you want to watch. The credentials are stored server-side, in a file only this app reads — never in your browser.">
          <template #actions>
            <UButton color="neutral" variant="subtle" size="xs" icon="i-lucide-graduation-cap"
              @click="guideOpen = true">
              How do I get these?
            </UButton>
          </template>
        </UAlert>

        <ConnectClusterGuide v-model:open="guideOpen" />

        <div class="grid gap-3 sm:grid-cols-2">
          <UFormField label="Name" hint="shown in the switcher" required>
            <UInput v-model="form.name" placeholder="prod-eu" size="sm" class="w-full" />
          </UFormField>

          <UFormField label="API server" required>
            <UInput v-model="form.server" placeholder="https://127.0.0.1:6443" size="sm" class="w-full font-mono" />
          </UFormField>
        </div>

        <UFormField label="ServiceAccount token" required>
          <UTextarea v-model="form.token" :rows="3" placeholder="eyJhbGciOiJSUzI1NiIsImtpZCI6..." size="sm"
            class="w-full font-mono" :ui="{
              base: 'focus-visible:ring-info'
            }" />
        </UFormField>

        <UFormField label="Cluster CA certificate"
          :hint="form.insecureSkipTlsVerify ? 'ignored while verification is off' : 'base64, from the kubeconfig'">
          <UTextarea v-model="form.certificate" :rows="3" :disabled="form.insecureSkipTlsVerify"
            placeholder="LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0t..." size="sm" class="w-full font-mono" :ui="{
              base: 'focus-visible:ring-info'
            }" />
        </UFormField>

        <USwitch v-model="form.insecureSkipTlsVerify" size="xs" color="info"
          label="Connect without verifying the certificate"
          description="Only for a cluster whose CA you cannot obtain. The connection stays encrypted, but nothing proves you are talking to the right server." />

        <UAlert v-if="result" :color="result.ok ? 'success' : 'error'" variant="subtle"
          :icon="result.ok ? 'i-lucide-check' : 'i-lucide-triangle-alert'" :title="result.ok ? 'Reachable' : 'Refused'"
          :description="result.message" :ui="{ description: 'text-[11px] leading-relaxed' }" />
      </div>
    </template>

    <template #footer>
      <div class="flex w-full items-center gap-2">
        <UButton class="ml-auto" color="neutral" variant="ghost" size="sm" @click="open = false">
          Cancel
        </UButton>
        <UButton color="neutral" variant="subtle" size="sm" icon="i-lucide-plug-zap" :loading="busy === 'test'"
          :disabled="!canSubmit || busy !== null" @click="submit(true)">
          Test
        </UButton>
        <UButton color="info" size="sm" icon="i-lucide-link" :loading="busy === 'connect'"
          :disabled="!canSubmit || busy !== null" @click="submit(false)">
          Connect
        </UButton>
      </div>
    </template>
  </UModal>
</template>
