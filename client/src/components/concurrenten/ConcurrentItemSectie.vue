<template>
  <div class="card p-4">
    <div class="flex items-center justify-between mb-3">
      <h4 class="text-sm font-semibold text-gray-800">{{ icon }} {{ titel }} <span class="text-gray-400 font-normal">({{ items.length }})</span></h4>
      <button class="text-xs text-pienter-600 hover:underline" @click="showBulk = !showBulk">📋 Plakken-import</button>
    </div>

    <!-- Bulk import -->
    <div v-if="showBulk" class="mb-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
      <p class="text-xs text-gray-500 mb-1.5">Plak een lijst, één per regel.</p>
      <textarea v-model="bulkText" class="textarea text-sm" rows="4" :placeholder="`${placeholder}\n...`" />
      <div class="flex gap-2 mt-2">
        <button class="btn-primary btn-sm" :disabled="!bulkLines.length" @click="doBulk">{{ bulkLines.length }} toevoegen</button>
        <button class="btn-secondary btn-sm" @click="showBulk = false">Sluiten</button>
      </div>
    </div>

    <!-- Rijen -->
    <div class="space-y-1.5">
      <div v-for="item in items" :key="item.id" class="group flex items-center gap-2">
        <input
          :value="item.naam"
          :list="datalistId"
          class="input text-sm py-1 flex-1"
          @change="emitUpdate(item.id, { naam: ($event.target as HTMLInputElement).value })"
        />
        <input
          v-if="metUrl"
          :value="item.url"
          placeholder="url (optioneel)"
          class="input text-sm py-1 w-40"
          @change="emitUpdate(item.id, { url: ($event.target as HTMLInputElement).value })"
        />
        <input
          :value="item.notitie"
          placeholder="notitie"
          class="input text-sm py-1 w-40"
          @change="emitUpdate(item.id, { notitie: ($event.target as HTMLInputElement).value })"
        />
        <button class="text-gray-300 hover:text-red-500 px-1 opacity-0 group-hover:opacity-100 transition-opacity" @click="$emit('delete', item.id)">✕</button>
      </div>
    </div>

    <!-- Nieuwe rij -->
    <div class="flex items-center gap-2 mt-2">
      <input
        v-model="newNaam"
        :list="datalistId"
        class="input text-sm py-1 flex-1"
        :placeholder="placeholder"
        @keyup.enter="doAdd"
      />
      <input v-if="metUrl" v-model="newUrl" placeholder="url (optioneel)" class="input text-sm py-1 w-40" @keyup.enter="doAdd" />
      <button class="btn-secondary btn-sm shrink-0" :disabled="!newNaam.trim()" @click="doAdd">+ toevoegen</button>
    </div>
    <p v-if="inlineError" class="text-xs text-amber-600 mt-1">{{ inlineError }}</p>

    <datalist :id="datalistId">
      <option v-for="l in labels" :key="l" :value="l" />
    </datalist>

    <!-- Quick-add chips -->
    <div class="flex flex-wrap gap-1.5 mt-3">
      <button
        v-for="q in quickAdds"
        :key="q"
        class="text-xs px-2 py-1 rounded-full border transition-colors"
        :class="isPresent(q)
          ? 'border-gray-200 text-gray-300 cursor-default'
          : 'border-pienter-200 text-pienter-700 hover:bg-pienter-50'"
        :disabled="isPresent(q)"
        @click="quickAdd(q)"
      >+ {{ q }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface ItemLike { id: string; naam: string; url?: string; notitie?: string }

const props = defineProps<{
  titel: string
  icon: string
  metUrl?: boolean
  items: ItemLike[]
  labels: string[]
  quickAdds: string[]
  bestaandeLabels: string[] // genormaliseerde labels al bij deze concurrent
  placeholder: string
}>()

const emit = defineEmits<{
  add: [naam: string, url?: string]
  update: [id: string, patch: Partial<ItemLike>]
  delete: [id: string]
  bulk: [namen: string[]]
}>()

const newNaam = ref('')
const newUrl = ref('')
const showBulk = ref(false)
const bulkText = ref('')
const inlineError = ref('')

// Uniek datalist-id per sectie-instantie zonder Math.random (verboden in scripts elders;
// hier prima, maar we leiden het af van de titel voor stabiliteit).
const datalistId = computed(() => `dl-${props.titel.toLowerCase().replace(/[^a-z]/g, '')}`)

const bulkLines = computed(() =>
  bulkText.value.split('\n').map(l => l.trim()).filter(Boolean),
)

function isPresent(naam: string) {
  return props.bestaandeLabels.includes(naam.trim().toLowerCase())
}

function doAdd() {
  const naam = newNaam.value.trim()
  if (!naam) return
  if (isPresent(naam)) {
    inlineError.value = `"${naam}" staat al in deze lijst.`
    return
  }
  inlineError.value = ''
  emit('add', naam, props.metUrl ? newUrl.value.trim() : undefined)
  newNaam.value = ''
  newUrl.value = ''
}

function quickAdd(naam: string) {
  if (isPresent(naam)) return
  emit('add', naam)
}

function emitUpdate(id: string, patch: Partial<ItemLike>) {
  emit('update', id, patch)
}

function doBulk() {
  if (!bulkLines.value.length) return
  emit('bulk', bulkLines.value)
  bulkText.value = ''
  showBulk.value = false
}
</script>
