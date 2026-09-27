<template>
  <div class="fixed inset-0 bg-black/30 flex items-center justify-center z-50" @click.self="$emit('close')">
    <div class="bg-white rounded-xl shadow-xl w-full max-w-lg p-6" role="dialog" aria-modal="true" aria-labelledby="samenvoegen-titel">
      <div class="flex items-start justify-between gap-4 mb-2">
        <h3 id="samenvoegen-titel" class="text-lg font-bold text-gray-900">Pagina's samenvoegen</h3>
        <button class="btn-ghost btn-sm btn-icon" aria-label="Sluiten" @click="$emit('close')"><KIcon name="close" :size="16" /></button>
      </div>
      <p class="text-sm text-gray-600 mb-4">
        Kies welke pagina blijft bestaan. De andere pagina verdwijnt: haar blokken en subpagina's verhuizen mee
        en haar oude URL verwijst voortaan door naar de pagina die blijft.
      </p>

      <div class="space-y-2">
        <label
          v-for="n in pair"
          :key="n.id"
          class="flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors"
          :class="keepId === n.id ? 'border-pienter-500 bg-pienter-50' : 'border-gray-200 hover:bg-gray-50'"
        >
          <input v-model="keepId" type="radio" name="keep" :value="n.id" class="mt-1" />
          <span class="min-w-0">
            <span class="block text-sm font-semibold text-gray-900">{{ n.title }} blijft</span>
            <span class="block mono text-gray-500 truncate">{{ n.fullUrl }}</span>
            <span class="block text-xs text-gray-500 mt-1">{{ blockCount(n.id) }} blokken · focus: {{ n.focusTopic || '—' }}</span>
          </span>
        </label>
      </div>

      <p v-if="removed" class="text-xs text-gray-500 mt-4 flex items-start gap-1.5">
        <KIcon name="undo" :size="14" class="mt-px shrink-0" />
        <span><span class="mono">{{ removedPath }}</span> gaat doorverwijzen naar <strong class="text-gray-700">{{ kept?.title }}</strong>.</span>
      </p>
      <p v-if="error" class="text-sm text-red-600 mt-3">{{ error }}</p>

      <div class="flex justify-end gap-2 mt-6">
        <button class="btn-secondary btn-sm" @click="$emit('close')">Annuleren</button>
        <button class="btn-primary btn-sm" :disabled="!keepId || busy" @click="confirm">
          <KIcon name="merge" :size="14" />{{ busy ? 'Bezig…' : 'Samenvoegen' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import KIcon from '../ui/KIcon.vue'
import { computed, ref } from 'vue'
import { useStructuurStore } from '../../stores/structuurStore'
import type { SiteNode } from '@shared/types'

const props = defineProps<{ projectId: string; nodeIds: [string, string] }>()
const emit = defineEmits<{ close: []; merged: [keptId: string] }>()
const store = useStructuurStore()

const pair = computed(() =>
  props.nodeIds.map(id => store.siteNodes.find(n => n.id === id)).filter((n): n is SiteNode => !!n),
)
const keepId = ref<string>(props.nodeIds[0])
const kept = computed(() => pair.value.find(n => n.id === keepId.value))
const removed = computed(() => pair.value.find(n => n.id !== keepId.value))
const removedPath = computed(() => removed.value?.fullUrl.replace(/^https?:\/+[^/]+/, '') || '/')
const busy = ref(false)
const error = ref('')

function blockCount(nodeId: string) {
  return store.allProjectBlocks.filter(b => b.siteNodeId === nodeId).length
}

async function confirm() {
  if (!kept.value || !removed.value) return
  busy.value = true
  error.value = ''
  try {
    await store.mergeNode(props.projectId, removed.value.id, kept.value.id)
    emit('merged', kept.value.id)
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Samenvoegen is mislukt.'
  } finally {
    busy.value = false
  }
}
</script>
