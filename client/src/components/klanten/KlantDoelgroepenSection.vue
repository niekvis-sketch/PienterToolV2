<template>
  <div class="card p-5">
    <div class="flex items-center justify-between mb-4">
      <h3 class="font-semibold text-gray-800">Doelgroepen &amp; persona's</h3>
      <button class="btn-secondary btn-sm" @click="startAdd">+ Toevoegen</button>
    </div>

    <div v-if="store.doelgroepen.length === 0 && !showForm" class="text-sm text-gray-500">
      Nog geen doelgroepen vastgelegd op klantniveau.
    </div>

    <div v-if="showForm" class="border border-pienter-200 rounded-lg p-4 mb-4 bg-pienter-50/40 space-y-3">
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Naam doelgroep</label>
          <input v-model="form.naam" class="input" placeholder="bijv. Facility managers retail" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Persona (kort profiel)</label>
          <input v-model="form.persona" class="input" placeholder="bijv. Mark, 45 j., FM bij supermarkt" />
        </div>
        <div class="col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-1">Omschrijving</label>
          <textarea v-model="form.omschrijving" class="input min-h-[60px]" rows="2" placeholder="Wie zijn ze, wat motiveert ze?" />
        </div>
        <div class="col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-1">Pijnpunten</label>
          <textarea v-model="form.pijnpunten" class="input min-h-[60px]" rows="2" placeholder="Welke problemen ervaren ze?" />
        </div>
      </div>
      <div class="flex gap-2">
        <button class="btn-primary btn-sm" :disabled="!form.naam" @click="handleSave">Opslaan</button>
        <button class="btn-secondary btn-sm" @click="cancel">Annuleren</button>
      </div>
    </div>

    <div v-if="store.doelgroepen.length > 0" class="grid gap-3 sm:grid-cols-2">
      <div
        v-for="dg in store.doelgroepen"
        :key="dg.id"
        class="border border-gray-200 rounded-lg p-3"
      >
        <div class="flex items-start justify-between gap-2">
          <div class="flex-1 min-w-0">
            <p class="font-medium text-gray-900">{{ dg.naam }}</p>
            <p v-if="dg.persona" class="text-xs text-gray-500 mt-0.5">{{ dg.persona }}</p>
          </div>
          <div class="flex gap-1 shrink-0">
            <button class="text-gray-400 hover:text-pienter-600 text-xs px-1" @click="startEdit(dg.id)">✎</button>
            <button class="text-gray-300 hover:text-red-500 text-xs px-1" @click="handleDelete(dg.id)">✕</button>
          </div>
        </div>
        <div v-if="dg.omschrijving" class="mt-2">
          <p class="text-xs text-gray-500 uppercase tracking-wide">Omschrijving</p>
          <p class="text-sm text-gray-700 whitespace-pre-wrap">{{ dg.omschrijving }}</p>
        </div>
        <div v-if="dg.pijnpunten" class="mt-2">
          <p class="text-xs text-gray-500 uppercase tracking-wide">Pijnpunten</p>
          <p class="text-sm text-gray-700 whitespace-pre-wrap">{{ dg.pijnpunten }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useKlantenStore } from '../../stores/klantenStore'
import type { KlantDoelgroep } from '@shared/types'

const store = useKlantenStore()
const klant = computed(() => store.currentKlant!)

const showForm = ref(false)
const editingId = ref<string | null>(null)

const empty = (): Partial<KlantDoelgroep> => ({ naam: '', persona: '', omschrijving: '', pijnpunten: '' })
const form = reactive<Partial<KlantDoelgroep>>(empty())

function startAdd() {
  editingId.value = null
  Object.assign(form, empty())
  showForm.value = true
}

function startEdit(id: string) {
  const dg = store.doelgroepen.find(d => d.id === id)
  if (!dg) return
  editingId.value = id
  Object.assign(form, { naam: dg.naam, persona: dg.persona, omschrijving: dg.omschrijving, pijnpunten: dg.pijnpunten })
  showForm.value = true
}

function cancel() {
  showForm.value = false
  editingId.value = null
  Object.assign(form, empty())
}

async function handleSave() {
  if (editingId.value) {
    await store.updateKlantDoelgroep(klant.value.id, editingId.value, { ...form })
  } else {
    await store.createKlantDoelgroep(klant.value.id, { ...form })
  }
  cancel()
}

async function handleDelete(id: string) {
  if (confirm('Doelgroep verwijderen?')) {
    await store.deleteKlantDoelgroep(klant.value.id, id)
  }
}
</script>
