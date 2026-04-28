<template>
  <div class="card p-5">
    <div class="flex items-center justify-between mb-4">
      <h3 class="font-semibold text-gray-800">Aanvullende contactpersonen</h3>
      <button class="btn-secondary btn-sm" @click="startAdd">+ Toevoegen</button>
    </div>

    <div v-if="store.contactpersonen.length === 0 && !showForm" class="text-sm text-gray-500">
      Nog geen aanvullende contactpersonen. De primaire contactpersoon staat bij Contactgegevens.
    </div>

    <div v-if="showForm" class="border border-pienter-200 rounded-lg p-4 mb-4 bg-pienter-50/40 space-y-3">
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Naam</label>
          <input v-model="form.naam" class="input" placeholder="Volledige naam" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Rol</label>
          <input v-model="form.rol" class="input" placeholder="bijv. Marketing manager" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
          <input v-model="form.email" type="email" class="input" placeholder="naam@bedrijf.nl" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Telefoon</label>
          <input v-model="form.telefoon" class="input" placeholder="06-..." />
        </div>
        <div class="col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-1">Opmerkingen</label>
          <textarea v-model="form.opmerkingen" class="input min-h-[60px]" rows="2" placeholder="Optioneel" />
        </div>
      </div>
      <div class="flex gap-2">
        <button class="btn-primary btn-sm" :disabled="!form.naam" @click="handleSave">Opslaan</button>
        <button class="btn-secondary btn-sm" @click="cancel">Annuleren</button>
      </div>
    </div>

    <div v-if="store.contactpersonen.length > 0" class="space-y-2">
      <div
        v-for="cp in store.contactpersonen"
        :key="cp.id"
        class="border border-gray-200 rounded-lg p-3 flex items-start justify-between gap-3"
      >
        <div class="flex-1 min-w-0">
          <div class="flex items-baseline gap-2 flex-wrap">
            <span class="font-medium text-gray-900">{{ cp.naam || '–' }}</span>
            <span v-if="cp.rol" class="text-xs text-gray-500">{{ cp.rol }}</span>
          </div>
          <div class="text-sm text-gray-600 mt-1 flex flex-wrap gap-x-4 gap-y-0.5">
            <a v-if="cp.email" :href="`mailto:${cp.email}`" class="text-pienter-600 hover:underline">{{ cp.email }}</a>
            <span v-if="cp.telefoon">{{ cp.telefoon }}</span>
          </div>
          <p v-if="cp.opmerkingen" class="text-xs text-gray-500 mt-1 whitespace-pre-wrap">{{ cp.opmerkingen }}</p>
        </div>
        <div class="flex gap-1 shrink-0">
          <button class="text-gray-400 hover:text-pienter-600 text-xs px-2" @click="startEdit(cp.id)">Bewerken</button>
          <button class="text-gray-300 hover:text-red-500 text-xs px-2" @click="handleDelete(cp.id)">✕</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useKlantenStore } from '../../stores/klantenStore'
import type { KlantContactpersoon } from '@shared/types'

const store = useKlantenStore()
const klant = computed(() => store.currentKlant!)

const showForm = ref(false)
const editingId = ref<string | null>(null)

const empty = (): Partial<KlantContactpersoon> => ({ naam: '', rol: '', email: '', telefoon: '', opmerkingen: '' })
const form = reactive<Partial<KlantContactpersoon>>(empty())

function startAdd() {
  editingId.value = null
  Object.assign(form, empty())
  showForm.value = true
}

function startEdit(id: string) {
  const cp = store.contactpersonen.find(c => c.id === id)
  if (!cp) return
  editingId.value = id
  Object.assign(form, { naam: cp.naam, rol: cp.rol, email: cp.email, telefoon: cp.telefoon, opmerkingen: cp.opmerkingen })
  showForm.value = true
}

function cancel() {
  showForm.value = false
  editingId.value = null
  Object.assign(form, empty())
}

async function handleSave() {
  if (editingId.value) {
    await store.updateContactpersoon(klant.value.id, editingId.value, { ...form })
  } else {
    await store.createContactpersoon(klant.value.id, { ...form })
  }
  cancel()
}

async function handleDelete(id: string) {
  if (confirm('Contactpersoon verwijderen?')) {
    await store.deleteContactpersoon(klant.value.id, id)
  }
}
</script>
