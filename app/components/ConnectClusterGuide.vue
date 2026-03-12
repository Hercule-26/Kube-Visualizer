<script setup lang="ts">
import manifest from '~~/deploy/remote-cluster-access.yaml?raw'

const open = defineModel<boolean>('open', { required: true })

const showManifest = ref(false)
const copiedItem = ref<string | null>(null)

const manifestLines = computed(() =>
  manifest.trimEnd().split('\n').length,
)

const commands = {
  apply: 'kubectl apply -f remote-cluster-access.yaml',
  server: "kubectl config view --minify --raw -o jsonpath='{.clusters[0].cluster.server}'",
  token: 'kubectl create token kube-visualizer -n kube-visualizer --duration=720h',
  certificate: "kubectl config view --minify --raw -o jsonpath='{.clusters[0].cluster.certificate-authority-data}'",
  remove: 'kubectl delete -f remote-cluster-access.yaml',
}

async function copyText(id: string, text: string) {
  try {
    await navigator.clipboard.writeText(text)

    copiedItem.value = id

    setTimeout(() => {
      if (copiedItem.value === id)
        copiedItem.value = null
    }, 1600)
  }
  catch {
    // Clipboard unavailable
  }
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="Connect a cluster"
    description="Follow these steps to get the required connection information."
    :ui="{ content: 'sm:max-w-2xl' }"
  >
    <template #body>
      <div class="max-h-[68vh] space-y-5 overflow-y-auto pr-1 kv-scroll">

        <!-- Step 1 -->
        <section class="space-y-2">
          <div class="flex items-center gap-2">
            <span
              class="flex size-6 shrink-0 items-center justify-center rounded-full bg-info/10 text-[11px] font-semibold text-info"
            >
              1
            </span>

            <h3 class="text-xs font-medium text-highlighted">
              Grant access to the cluster
            </h3>
          </div>

          <p class="pl-8 text-[11.5px] leading-relaxed text-muted">
            Apply the provided manifest to the Kubernetes cluster you want to
            connect. It creates a dedicated ServiceAccount with read-only
            permissions.
          </p>

          <div class="ml-8 flex flex-wrap gap-1.5">
            <UButton
              :icon="copiedItem === 'manifest' ? 'i-lucide-check' : 'i-lucide-copy'"
              :color="copiedItem === 'manifest' ? 'success' : 'neutral'"
              variant="subtle"
              size="xs"
              @click="copyText('manifest', manifest)"
            >
              {{ copiedItem === 'manifest' ? 'Copied' : 'Copy manifest' }}
            </UButton>

            <UButton
              :icon="showManifest ? 'i-lucide-eye-off' : 'i-lucide-eye'"
              color="neutral"
              variant="ghost"
              size="xs"
              @click="showManifest = !showManifest"
            >
              {{ showManifest ? 'Hide manifest' : `View manifest (${manifestLines} lines)` }}
            </UButton>
          </div>

          <pre
            v-if="showManifest"
            class="ml-8 max-h-64 overflow-auto rounded-md border border-default bg-elevated/50 p-2.5 text-[10px] leading-relaxed text-muted kv-mono kv-scroll"
          >{{ manifest.trimEnd() }}</pre>

          <div
            class="relative ml-8 cursor-pointer"
            @click="copyText('apply', commands.apply)"
          >
            <pre
              class="whitespace-pre-wrap wrap-break-words rounded-md border border-default bg-elevated/50 py-1.5 pl-2.5 pr-9 text-[10.5px] leading-relaxed text-muted kv-mono transition-colors hover:bg-elevated"
            >{{ commands.apply }}</pre>

            <UButton
              :icon="copiedItem === 'apply' ? 'i-lucide-check' : 'i-lucide-copy'"
              :color="copiedItem === 'apply' ? 'success' : 'neutral'"
              variant="ghost"
              size="xs"
              class="absolute right-1 top-1"
              tabindex="-1"
              @click.stop="copyText('apply', commands.apply)"
            />
          </div>
        </section>

        <!-- Step 2 -->
        <section class="space-y-2">
          <div class="flex items-center gap-2">
            <span
              class="flex size-6 shrink-0 items-center justify-center rounded-full bg-info/10 text-[11px] font-semibold text-info"
            >
              2
            </span>

            <h3 class="text-xs font-medium text-highlighted">
              Get the API server
            </h3>
          </div>

          <p class="pl-8 text-[11.5px] leading-relaxed text-muted">
            Run this command and paste the result into the
            <strong class="font-medium text-highlighted">
              API server
            </strong>
            field.
          </p>

          <div
            class="relative ml-8 cursor-pointer"
            @click="copyText('server', commands.server)"
          >
            <pre
              class="whitespace-pre-wrap wrap-break-words rounded-md border border-default bg-elevated/50 py-1.5 pl-2.5 pr-9 text-[10.5px] leading-relaxed text-muted kv-mono transition-colors hover:bg-elevated"
            >{{ commands.server }}</pre>

            <UButton
              :icon="copiedItem === 'server' ? 'i-lucide-check' : 'i-lucide-copy'"
              :color="copiedItem === 'server' ? 'success' : 'neutral'"
              variant="ghost"
              size="xs"
              class="absolute right-1 top-1"
              tabindex="-1"
              @click.stop="copyText('server', commands.server)"
            />
          </div>

          <p class="ml-8 text-[10.5px] leading-relaxed text-dimmed">
            The server must be reachable from where Kube Visualizer is running.
          </p>
        </section>

        <!-- Step 3 -->
        <section class="space-y-2">
          <div class="flex items-center gap-2">
            <span
              class="flex size-6 shrink-0 items-center justify-center rounded-full bg-info/10 text-[11px] font-semibold text-info"
            >
              3
            </span>

            <h3 class="text-xs font-medium text-highlighted">
              Create a temporary token
            </h3>
          </div>

          <p class="pl-8 text-[11.5px] leading-relaxed text-muted">
            Generate a token that expires automatically after 30 days, then
            paste it into the
            <strong class="font-medium text-highlighted">
              ServiceAccount token
            </strong>
            field.
          </p>

          <div
            class="relative ml-8 cursor-pointer"
            @click="copyText('token', commands.token)"
          >
            <pre
              class="whitespace-pre-wrap wrap-break-words rounded-md border border-default bg-elevated/50 py-1.5 pl-2.5 pr-9 text-[10.5px] leading-relaxed text-muted kv-mono transition-colors hover:bg-elevated"
            >{{ commands.token }}</pre>

            <UButton
              :icon="copiedItem === 'token' ? 'i-lucide-check' : 'i-lucide-copy'"
              :color="copiedItem === 'token' ? 'success' : 'neutral'"
              variant="ghost"
              size="xs"
              class="absolute right-1 top-1"
              tabindex="-1"
              @click.stop="copyText('token', commands.token)"
            />
          </div>
        </section>

        <!-- Step 4 -->
        <section class="space-y-2">
          <div class="flex items-center gap-2">
            <span
              class="flex size-6 shrink-0 items-center justify-center rounded-full bg-info/10 text-[11px] font-semibold text-info"
            >
              4
            </span>

            <h3 class="text-xs font-medium text-highlighted">
              Get the cluster certificate
            </h3>
          </div>

          <p class="pl-8 text-[11.5px] leading-relaxed text-muted">
            Run this command and paste the result into the
            <strong class="font-medium text-highlighted">
              Cluster CA certificate
            </strong>
            field.

            Do not decode the result.
          </p>

          <div
            class="relative ml-8 cursor-pointer"
            @click="copyText('certificate', commands.certificate)"
          >
            <pre
              class="whitespace-pre-wrap wrap-break-words rounded-md border border-default bg-elevated/50 py-1.5 pl-2.5 pr-9 text-[10.5px] leading-relaxed text-muted kv-mono transition-colors hover:bg-elevated"
            >{{ commands.certificate }}</pre>

            <UButton
              :icon="copiedItem === 'certificate' ? 'i-lucide-check' : 'i-lucide-copy'"
              :color="copiedItem === 'certificate' ? 'success' : 'neutral'"
              variant="ghost"
              size="xs"
              class="absolute right-1 top-1"
              tabindex="-1"
              @click.stop="copyText('certificate', commands.certificate)"
            />
          </div>
        </section>

        <!-- Permissions -->
        <section class="rounded-lg border border-default p-3">
          <div class="flex items-start gap-2">
            <UIcon
              name="i-lucide-shield-check"
              class="mt-0.5 size-4 shrink-0 text-success"
            />

            <div>
              <p class="text-xs font-medium text-highlighted">
                Read-only access
              </p>

              <p class="mt-1 text-[11px] leading-relaxed text-muted">
                The generated account can read cluster resources but cannot
                create, update or delete them. Secrets are not accessible.
              </p>
            </div>
          </div>
        </section>

        <!-- Step 5 -->
        <section class="space-y-2">
          <div class="flex items-center gap-2">
            <span
              class="flex size-6 shrink-0 items-center justify-center rounded-full bg-info/10 text-[11px] font-semibold text-info"
            >
              5
            </span>

            <h3 class="text-xs font-medium text-highlighted">
              Test the connection
            </h3>
          </div>

          <p class="pl-8 text-[11.5px] leading-relaxed text-muted">
            Fill in the form with the values above, then click
            <strong class="font-medium text-highlighted">
              Test
            </strong>.
            If the connection succeeds, you can connect the cluster.
          </p>
        </section>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-1.5 text-[10px] text-dimmed">
          <UIcon
            name="i-lucide-trash-2"
            class="size-3"
          />

          <span>Remove access with</span>

          <button
            class="font-mono text-muted transition-colors hover:text-highlighted"
            @click="copyText('remove', commands.remove)"
          >
            {{ copiedItem === 'remove' ? 'Copied' : commands.remove }}
          </button>
        </div>

        <UButton
          color="info"
          size="sm"
          icon="i-lucide-arrow-left"
          @click="open = false"
        >
          Back to form
        </UButton>
      </div>
    </template>
  </UModal>
</template>