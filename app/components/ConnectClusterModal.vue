<script setup lang="ts">
import { EDITABLE_KINDS, type EditableKind } from '~~/shared/types/cluster'

const open = defineModel<boolean>('open', { required: true })

const toast = useToast()

const DEFAULTS = {
  name: '',
  server: '',
  token: '',
  certificate: '',
  insecureSkipTlsVerify: false,
  allowWrite: false,
  allowPodDelete: false,
  editableKinds: ['Deployment', 'StatefulSet'] as EditableKind[],
}

const form = reactive({ ...DEFAULTS })

const guideOpen = ref(false)
const busy = ref<'test' | 'connect' | null>(null)
const result = ref<{ ok: boolean, message: string } | null>(null)

const canSubmit = computed(() =>
  form.name.trim() !== ''
  && form.server.trim() !== ''
  && form.token.trim() !== ''
  && (form.certificate.trim() !== '' || form.insecureSkipTlsVerify)
  && (!form.allowWrite || form.editableKinds.length > 0),
)

watch(open, (isOpen) => {
  if (!isOpen)
    return
  Object.assign(form, { ...DEFAULTS, editableKinds: [...DEFAULTS.editableKinds] })
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
    const response = await $fetch('/api/clusters', {
      method: 'POST',
      body: {
        name: form.name,
        server: form.server,
        token: form.token,
        certificate: form.certificate,
        insecureSkipTlsVerify: form.insecureSkipTlsVerify,
        allowWrite: form.allowWrite,
        allowPodDelete: form.allowPodDelete,
        editableKinds: form.editableKinds,
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

        <section class="space-y-3 rounded-lg border border-default p-3">
          <div>
            <h3 class="text-[11px] font-medium uppercase tracking-wide text-dimmed">
              What may this app can do here?
            </h3>
            <p class="mt-0.5 text-[10.5px] leading-relaxed text-muted">
              Saved with this cluster, so every other cluster keeps its own answer.
              The cluster's RBAC still has to allow it too — both have to say yes.
            </p>
          </div>

          <USwitch v-model="form.allowWrite" size="xs" color="info" label="Allow editing resources"
            description="Scaling, container images, rolling restarts, applying edited YAML and cordoning nodes." />

          <div v-if="form.allowWrite" class="pl-1">
            <UFormField label="Kinds it may edit"
              :hint="form.editableKinds.length === 0 ? 'pick at least one' : undefined"
              :error="form.editableKinds.length === 0">
              <USelectMenu v-model="form.editableKinds" :items="[...EDITABLE_KINDS]" multiple size="sm" class="w-full"
                placeholder="Select kinds" />
            </UFormField>

            <p v-if="form.editableKinds.includes('Node') || form.editableKinds.includes('ConfigMap')"
              class="mt-1.5 flex gap-1.5 rounded-md bg-warning/5 px-2 py-1.5 text-xs leading-relaxed text-muted">
              <UIcon name="i-lucide-triangle-alert" class="mt-0.5 size-3 shrink-0 text-warning" />
              <span>
                <template v-if="form.editableKinds.includes('Node')">
                  <strong>Node</strong> is cluster-scoped: an edit there reaches the scheduler
                  rather than one namespace.
                </template>
                <template v-if="form.editableKinds.includes('ConfigMap')">
                  <strong>ConfigMap</strong> changes how every pod mounting it behaves, at their
                  next restart rather than now.
                </template>
              </span>
            </p>
          </div>

          <USwitch v-model="form.allowPodDelete" size="xs" color="info" label="Allow restarting pods"
            description="Deletes a pod so its controller recreates it. Independent of editing." />
        </section>

        <UAlert v-if="result" :color="result.ok ? 'success' : 'error'" variant="subtle"
          :icon="result.ok ? 'i-lucide-check' : 'i-lucide-triangle-alert'" :title="result.ok ? 'Reachable' : 'Refused'"
          :description="result.message" :ui="{ description: 'text-[11px] leading-relaxed' }" />
      </div>
    </template>

    <template #footer>
      <div class="flex w-full items-center gap-2">
        <p class="text-[10px] text-dimmed">
          Refused here or refused by RBAC amounts to the same thing.
        </p>
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