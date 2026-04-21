<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-bold text-gray-900">Communicatie en historie</h2>
      <button class="btn-primary btn-sm" @click="showForm = true">+ Toevoegen</button>
    </div>

    <!-- Nieuw contactmoment formulier -->
    <div v-if="showForm" class="card p-5 space-y-4 border-pienter-200">
      <h3 class="font-semibold text-gray-800">Nieuw contactmoment</h3>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select v-model="newForm.type" class="select">
            <option value="email">E-mail</option>
            <option value="telefoon">Telefoon</option>
            <option value="meeting">Meeting</option>
            <option value="notitie">Notitie</option>
            <option value="offerte">Offerte</option>
            <option value="contract">Contract</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Datum</label>
          <input v-model="newForm.datum" type="date" class="input" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Medewerker</label>
          <input v-model="newForm.medewerker" class="input" placeholder="Naam" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Samenvatting</label>
          <input v-model="newForm.samenvatting" class="input" placeholder="Korte samenvatting" />
        </div>
        <div class="col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-1">Details</label>
          <textarea v-model="newForm.details" class="input min-h-[80px]" rows="3" placeholder="Uitgebreidere toelichting..." />
        </div>
      </div>
      <div class="flex gap-2">
        <button class="btn-primary btn-sm" :disabled="!newForm.samenvatting" @click="handleCreate">Opslaan</button>
        <button class="btn-secondary btn-sm" @click="cancelForm">Annuleren</button>
      </div>
    </div>

    <!-- Lege staat -->
    <div v-if="store.communicatie.length === 0 && !showForm" class="card p-10 text-center">
      <div class="text-3xl mb-3">💬</div>
      <p class="text-gray-500">Nog geen contactmomenten vastgelegd.</p>
    </div>

    <!-- Tijdlijn -->
    <div v-else-if="store.communicatie.length > 0" class="space-y-3">
      <div
        v-for="item in store.communicatie"
        :key="item.id"
        class="card p-4"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-start gap-3 flex-1">
            <span class="text-xl mt-0.5">{{ typeIcon(item.type) }}</span>
            <div class="flex-1">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded" :class="typeClass(item.type)">{{ typeLabel(item.type) }}</span>
                <span class="text-xs text-gray-400">{{ formatDate(item.datum) }}</span>
                <span v-if="item.medewerker" class="text-xs text-gray-400">· {{ item.medewerker }}</span>
              </div>
              <p class="font-medium text-gray-900 mt-1 text-sm">{{ item.samenvatting }}</p>
              <p v-if="item.details" class="text-sm text-gray-500 mt-1 whitespace-pre-wrap">{{ item.details }}</p>
            </div>
          </div>
          <button class="text-gray-300 hover:text-red-400 text-sm transition-colors shrink-0" title="Verwijderen" @click="handleDelete(item.id)">✕</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useKlantenStore } from '../../stores/klantenStore'
import type { KlantCommunicatieType } from '@shared/types'

const store = useKlantenStore()
const klant = computed(() => store.currentKlant!)
const showForm = ref(false)

const newForm = reactive({
  type: 'notitie' as KlantCommunicatieType,
  datum: new Date().toISOString().slice(0, 10),
  samenvatting: '',
  details: '',
  medewerker: '',
})

function cancelForm() {
  showForm.value = false
  Object.assign(newForm, { type: 'notitie', datum: new Date().toISOString().slice(0, 10), samenvatting: '', details: '', medewerker: '' })
}

async function handleCreate() {
  await store.createCommunicatie(klant.value.id, { ...newForm })
  cancelForm()
}

async function handleDelete(id: string) {
  if (confirm('Contactmoment verwijderen?')) {
    await store.deleteCommunicatie(klant.value.id, id)
  }
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })
}

function typeIcon(t: KlantCommunicatieType): string {
  return { email: '📧', telefoon: '📞', meeting: '🤝', notitie: '📝', offerte: '📄', contract: '✍️' }[t] ?? '💬'
}

function typeLabel(t: KlantCommunicatieType): string {
  return { email: 'E-mail', telefoon: 'Telefoon', meeting: 'Meeting', notitie: 'Notitie', offerte: 'Offerte', contract: 'Contract' }[t] ?? t
}

function typeClass(t: KlantCommunicatieType): string {
  return {
    email: 'bg-blue-100 text-blue-700',
    telefoon: 'bg-purple-100 text-purple-700',
    meeting: 'bg-green-100 text-green-700',
    notitie: 'bg-yellow-100 text-yellow-700',
    offerte: 'bg-orange-100 text-orange-700',
    contract: 'bg-red-100 text-red-700',
  }[t] ?? 'bg-gray-100 text-gray-600'
}
</script>
