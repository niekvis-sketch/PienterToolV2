<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-bold text-gray-900">Klantoverzicht</h2>
      <button v-if="!editing" class="btn-secondary btn-sm" @click="editing = true">Bewerken</button>
      <div v-else class="flex gap-2">
        <button class="btn-primary btn-sm" @click="handleSave">Opslaan</button>
        <button class="btn-secondary btn-sm" @click="handleCancel">Annuleren</button>
      </div>
    </div>

    <!-- Status kaarten -->
    <div class="grid grid-cols-3 gap-4">
      <div class="card p-4 text-center">
        <div class="text-2xl font-bold text-pienter-700">{{ projectenVoorKlant.length }}</div>
        <div class="text-sm text-gray-500 mt-1">Projecten</div>
      </div>
      <div class="card p-4 text-center">
        <div class="text-2xl font-bold text-pienter-700">{{ store.communicatie.length }}</div>
        <div class="text-sm text-gray-500 mt-1">Contactmomenten</div>
      </div>
      <div class="card p-4 text-center">
        <div class="text-lg font-bold mt-1 px-2 py-0.5 rounded-full inline-block" :class="statusClass(klant.status)">
          {{ statusLabel(klant.status) }}
        </div>
        <div class="text-sm text-gray-500 mt-1">Status</div>
      </div>
    </div>

    <!-- Basisgegevens weergave / edit -->
    <div class="card p-5 space-y-4">
      <h3 class="font-semibold text-gray-800">Algemeen</h3>

      <div v-if="!editing" class="space-y-3">
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span class="text-gray-500">Status</span>
            <p class="font-medium mt-0.5">{{ statusLabel(klant.status) }}</p>
          </div>
          <div>
            <span class="text-gray-500">Klant sinds</span>
            <p class="font-medium mt-0.5">{{ formatDate(klant.createdAt) }}</p>
          </div>
        </div>
        <div>
          <span class="text-sm text-gray-500">Notities</span>
          <p class="text-sm mt-0.5 whitespace-pre-wrap">{{ klant.notities || '–' }}</p>
        </div>
      </div>

      <div v-else class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select v-model="form.status" class="select">
            <option value="prospect">Prospect</option>
            <option value="actief">Actief</option>
            <option value="inactief">Inactief</option>
            <option value="voormalig">Voormalig</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Notities</label>
          <textarea v-model="form.notities" class="input min-h-[100px]" rows="4" placeholder="Algemene opmerkingen over deze klant..." />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { useKlantenStore } from '../../stores/klantenStore'
import { useProjectStore } from '../../stores/projectStore'
import type { KlantStatus } from '@shared/types'

const store = useKlantenStore()
const projectStore = useProjectStore()
const editing = ref(false)

const klant = computed(() => store.currentKlant!)

const projectenVoorKlant = computed(() =>
  projectStore.projects.filter(p => p.clientName === klant.value.naam)
)

const form = reactive({ status: '' as KlantStatus, notities: '' })

function startEdit() {
  form.status = klant.value.status
  form.notities = klant.value.notities
}

function handleCancel() {
  editing.value = false
}

async function handleSave() {
  await store.updateKlant(klant.value.id, { status: form.status, notities: form.notities })
  editing.value = false
}

watch(editing, (val) => { if (val) startEdit() })

function statusLabel(s: KlantStatus): string {
  return { prospect: 'Prospect', actief: 'Actief', inactief: 'Inactief', voormalig: 'Voormalig' }[s] ?? s
}

function statusClass(s: KlantStatus): string {
  return {
    prospect: 'bg-blue-100 text-blue-700',
    actief: 'bg-green-100 text-green-700',
    inactief: 'bg-gray-100 text-gray-600',
    voormalig: 'bg-red-100 text-red-600',
  }[s] ?? 'bg-gray-100 text-gray-600'
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })
}
</script>
