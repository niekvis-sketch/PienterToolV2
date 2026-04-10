<template>
  <div class="flex flex-col h-full px-12 py-8">
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h2 class="text-3xl font-bold" :class="textClass">📋 Doelgroeppaspoort</h2>
        <p class="text-sm mt-1" :class="subtextClass">Vul per doelgroep de kenmerken in om een scherp profiel te maken</p>
      </div>
      <!-- Doelgroep selector -->
      <select
        v-if="doelgroepen.length > 0"
        v-model="activeDoelgroepId"
        class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pienter-500"
      >
        <option v-for="dg in doelgroepen" :key="dg.id" :value="dg.id">{{ dg.name }}</option>
      </select>
    </div>

    <div v-if="doelgroepen.length === 0" class="flex-1 flex items-center justify-center">
      <p class="text-gray-400 text-sm">Maak eerst doelgroepen aan in de Doelgroepen-slide</p>
    </div>

    <div v-else class="flex-1 overflow-y-auto">
      <div class="grid grid-cols-2 gap-4">
        <!-- Leeftijd -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Leeftijd</label>
          <input
            :value="current.leeftijd"
            @input="updateField('leeftijd', ($event.target as HTMLInputElement).value)"
            type="text"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pienter-500"
            placeholder="Bijv. 30-45 jaar"
          />
        </div>

        <!-- Functie -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Functie</label>
          <input
            :value="current.functie"
            @input="updateField('functie', ($event.target as HTMLInputElement).value)"
            type="text"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pienter-500"
            placeholder="Bijv. Marketing Manager"
          />
        </div>

        <!-- Opleiding -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Opleiding</label>
          <input
            :value="current.opleiding"
            @input="updateField('opleiding', ($event.target as HTMLInputElement).value)"
            type="text"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pienter-500"
            placeholder="Bijv. HBO/WO"
          />
        </div>

        <!-- Bedrijfsgrootte -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Bedrijfsgrootte</label>
          <input
            :value="current.bedrijfsgrootte"
            @input="updateField('bedrijfsgrootte', ($event.target as HTMLInputElement).value)"
            type="text"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pienter-500"
            placeholder="Bijv. 50-200 medewerkers"
          />
        </div>

        <!-- Beslisser -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Beslisser</label>
          <div class="flex gap-2 mt-1">
            <button
              class="px-4 py-2 rounded-lg text-sm font-medium border transition-colors"
              :class="current.beslisser === true ? 'bg-green-100 border-green-300 text-green-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'"
              @click="updateField('beslisser', true)"
            >Ja</button>
            <button
              class="px-4 py-2 rounded-lg text-sm font-medium border transition-colors"
              :class="current.beslisser === false ? 'bg-red-100 border-red-300 text-red-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'"
              @click="updateField('beslisser', false)"
            >Nee</button>
          </div>
        </div>

        <!-- Gender -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Gender</label>
          <input
            :value="current.gender"
            @input="updateField('gender', ($event.target as HTMLInputElement).value)"
            type="text"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pienter-500"
            placeholder="Bijv. Man/Vrouw/Divers"
          />
        </div>

        <!-- Brancheklimaat -->
        <div class="col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-1">Brancheklimaat</label>
          <textarea
            :value="current.brancheklimaat"
            @input="updateField('brancheklimaat', ($event.target as HTMLTextAreaElement).value)"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pienter-500 resize-none"
            rows="2"
            placeholder="Beschrijf het klimaat van de branche..."
          ></textarea>
        </div>

        <!-- Mediakanalen -->
        <div class="col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-1">Mediakanalen</label>
          <div class="flex flex-wrap gap-2 mb-2">
            <span
              v-for="(k, i) in current.mediakanalen"
              :key="i"
              class="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium"
            >
              {{ k }}
              <button class="text-blue-400 hover:text-blue-700" @click="removeKanaal(i)">✕</button>
            </span>
          </div>
          <div class="flex gap-2">
            <input
              v-model="newKanaal"
              type="text"
              class="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pienter-500"
              placeholder="Bijv. LinkedIn, Google, Instagram..."
              @keyup.enter="addKanaal"
            />
            <button
              class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 shrink-0"
              @click="addKanaal"
            >+ Toevoegen</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useProjectStore } from '../../stores/projectStore'
import type { PresentatieSessie, DoelgroepPaspoort } from '@shared/types'

const props = defineProps<{
  sessie: PresentatieSessie
  textClass: string
  subtextClass: string
}>()

const emit = defineEmits<{ (e: 'update', patch: Partial<PresentatieSessie>): void }>()

const projectStore = useProjectStore()
const doelgroepen = computed(() => projectStore.doelgroepen)

const activeDoelgroepId = ref('')
const newKanaal = ref('')

// Auto-select first doelgroep
watch(doelgroepen, (dgs) => {
  if (dgs.length > 0 && !activeDoelgroepId.value) {
    activeDoelgroepId.value = dgs[0].id
  }
}, { immediate: true })

function emptyPaspoort(doelgroepId: string): DoelgroepPaspoort {
  return {
    id: doelgroepId,
    doelgroepId,
    leeftijd: '',
    functie: '',
    opleiding: '',
    bedrijfsgrootte: '',
    beslisser: null,
    brancheklimaat: '',
    mediakanalen: [],
    gender: '',
  }
}

const current = computed(() => {
  const found = props.sessie.doelgroepPaspoorten.find(p => p.doelgroepId === activeDoelgroepId.value)
  return found || emptyPaspoort(activeDoelgroepId.value)
})

let debounceTimer: ReturnType<typeof setTimeout>
function updateField(field: keyof DoelgroepPaspoort, value: unknown) {
  const paspoort = { ...current.value, [field]: value }
  const all = [...props.sessie.doelgroepPaspoorten]
  const idx = all.findIndex(p => p.doelgroepId === activeDoelgroepId.value)
  if (idx >= 0) {
    all[idx] = paspoort
  } else {
    all.push(paspoort)
  }
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    emit('update', { doelgroepPaspoorten: all })
  }, 500)
}

function addKanaal() {
  const val = newKanaal.value.trim()
  if (!val) return
  const updated = [...current.value.mediakanalen, val]
  updateField('mediakanalen', updated)
  newKanaal.value = ''
}

function removeKanaal(index: number) {
  const updated = current.value.mediakanalen.filter((_, i) => i !== index)
  updateField('mediakanalen', updated)
}
</script>
