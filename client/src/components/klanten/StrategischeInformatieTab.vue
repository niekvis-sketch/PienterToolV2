<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-bold text-gray-900">Strategische informatie</h2>
      <button v-if="!editing" class="btn-secondary btn-sm" @click="startEdit">Bewerken</button>
      <div v-else class="flex gap-2">
        <button class="btn-primary btn-sm" @click="handleSave">Opslaan</button>
        <button class="btn-secondary btn-sm" @click="editing = false">Annuleren</button>
      </div>
    </div>

    <div class="card p-5 space-y-5">
      <div v-if="!editing" class="space-y-5 text-sm">
        <div>
          <span class="text-gray-500 font-medium">Doelstellingen</span>
          <p class="mt-1 whitespace-pre-wrap text-gray-800">{{ klant.doelstellingen || '–' }}</p>
        </div>
        <div>
          <span class="text-gray-500 font-medium">Uitdagingen</span>
          <p class="mt-1 whitespace-pre-wrap text-gray-800">{{ klant.uitdagingen || '–' }}</p>
        </div>
        <div>
          <span class="text-gray-500 font-medium">Kansen</span>
          <p class="mt-1 whitespace-pre-wrap text-gray-800">{{ klant.kansen || '–' }}</p>
        </div>
        <div>
          <span class="text-gray-500 font-medium">Concurrenten</span>
          <p class="mt-1 whitespace-pre-wrap text-gray-800">{{ klant.concurrenten || '–' }}</p>
        </div>
        <div>
          <span class="text-gray-500 font-medium">Positionering</span>
          <p class="mt-1 whitespace-pre-wrap text-gray-800">{{ klant.positionering || '–' }}</p>
        </div>
      </div>

      <div v-else class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Doelstellingen</label>
          <textarea v-model="form.doelstellingen" class="input min-h-[80px]" rows="3" placeholder="Wat wil de klant bereiken?" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Uitdagingen</label>
          <textarea v-model="form.uitdagingen" class="input min-h-[80px]" rows="3" placeholder="Welke uitdagingen ervaart de klant?" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Kansen</label>
          <textarea v-model="form.kansen" class="input min-h-[80px]" rows="3" placeholder="Welke kansen liggen er?" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Concurrenten</label>
          <textarea v-model="form.concurrenten" class="input min-h-[80px]" rows="3" placeholder="Wie zijn de concurrenten?" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Positionering</label>
          <textarea v-model="form.positionering" class="input min-h-[80px]" rows="3" placeholder="Hoe positioneert de klant zichzelf in de markt?" />
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
  doelstellingen: '', uitdagingen: '', kansen: '', concurrenten: '', positionering: '',
})

function startEdit() {
  Object.assign(form, {
    doelstellingen: klant.value.doelstellingen,
    uitdagingen: klant.value.uitdagingen,
    kansen: klant.value.kansen,
    concurrenten: klant.value.concurrenten,
    positionering: klant.value.positionering,
  })
  editing.value = true
}

async function handleSave() {
  await store.updateKlant(klant.value.id, { ...form })
  editing.value = false
}
</script>
