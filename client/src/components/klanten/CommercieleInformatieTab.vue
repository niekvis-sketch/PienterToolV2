<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-bold text-gray-900">Commerciële informatie</h2>
      <button v-if="!editing" class="btn-secondary btn-sm" @click="startEdit">Bewerken</button>
      <div v-else class="flex gap-2">
        <button class="btn-primary btn-sm" @click="handleSave">Opslaan</button>
        <button class="btn-secondary btn-sm" @click="editing = false">Annuleren</button>
      </div>
    </div>

    <div class="card p-5">
      <h3 class="font-semibold text-gray-800 mb-4">Contract</h3>

      <div v-if="!editing" class="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
        <div>
          <span class="text-gray-500">Type contract</span>
          <p class="font-medium mt-0.5">{{ klant.contractType || '–' }}</p>
        </div>
        <div>
          <span class="text-gray-500">Contractwaarde</span>
          <p class="font-medium mt-0.5">{{ klant.contractWaarde != null ? formatEuro(klant.contractWaarde) : '–' }}</p>
        </div>
        <div>
          <span class="text-gray-500">Startdatum</span>
          <p class="font-medium mt-0.5">{{ klant.contractStartdatum ? formatDate(klant.contractStartdatum) : '–' }}</p>
        </div>
        <div>
          <span class="text-gray-500">Einddatum</span>
          <p class="font-medium mt-0.5">{{ klant.contractEinddatum ? formatDate(klant.contractEinddatum) : '–' }}</p>
        </div>
      </div>

      <div v-else class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Type contract</label>
          <input v-model="form.contractType" class="input" placeholder="bijv. Retainer, Project, Eenmalig" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Contractwaarde (€)</label>
          <input v-model.number="form.contractWaarde" type="number" min="0" class="input" placeholder="0" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Startdatum</label>
          <input v-model="form.contractStartdatum" type="date" class="input" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Einddatum</label>
          <input v-model="form.contractEinddatum" type="date" class="input" />
        </div>
      </div>
    </div>

    <div class="card p-5">
      <h3 class="font-semibold text-gray-800 mb-4">Facturatie</h3>

      <div v-if="!editing" class="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
        <div>
          <span class="text-gray-500">Facturatiemethode</span>
          <p class="font-medium mt-0.5">{{ klant.facturatiemethode || '–' }}</p>
        </div>
        <div>
          <span class="text-gray-500">Betaaltermijn</span>
          <p class="font-medium mt-0.5">{{ klant.betaaltermijn != null ? `${klant.betaaltermijn} dagen` : '–' }}</p>
        </div>
      </div>

      <div v-else class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Facturatiemethode</label>
          <input v-model="form.facturatiemethode" class="input" placeholder="bijv. Maandelijks achteraf" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Betaaltermijn (dagen)</label>
          <input v-model.number="form.betaaltermijn" type="number" min="0" class="input" placeholder="30" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useKlantenStore } from '../../stores/klantenStore'

const store = useKlantenStore()
const editing = ref(false)
const klant = computed(() => store.currentKlant!)

const form = reactive({
  contractType: '',
  contractWaarde: null as number | null,
  contractStartdatum: null as string | null,
  contractEinddatum: null as string | null,
  facturatiemethode: '',
  betaaltermijn: null as number | null,
})

function startEdit() {
  Object.assign(form, {
    contractType: klant.value.contractType,
    contractWaarde: klant.value.contractWaarde,
    contractStartdatum: klant.value.contractStartdatum,
    contractEinddatum: klant.value.contractEinddatum,
    facturatiemethode: klant.value.facturatiemethode,
    betaaltermijn: klant.value.betaaltermijn,
  })
  editing.value = true
}

async function handleSave() {
  await store.updateKlant(klant.value.id, { ...form })
  editing.value = false
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatEuro(n: number): string {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(n)
}
</script>
