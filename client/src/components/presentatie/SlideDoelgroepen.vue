<template>
  <div class="flex flex-col h-full px-12 py-8">
    <div class="mb-6">
      <h2 class="text-3xl font-bold" :class="textClass">👥 Doelgroepen</h2>
      <p class="text-sm mt-1" :class="subtextClass">Definieer de doelgroepen voor de website. Deze worden automatisch beschikbaar in de rest van de tool.</p>
    </div>
    <div class="flex-1 overflow-y-auto">
      <!-- Bestaande doelgroepen -->
      <div class="space-y-3 mb-6">
        <div
          v-for="dg in doelgroepen"
          :key="dg.id"
          class="flex items-center gap-3 bg-white rounded-xl border border-gray-200 px-5 py-4"
        >
          <div class="w-10 h-10 rounded-full bg-pienter-100 flex items-center justify-center text-pienter-600 font-bold text-sm shrink-0">
            {{ dg.name.charAt(0).toUpperCase() }}
          </div>
          <div class="flex-1 min-w-0">
            <div v-if="editingId === dg.id" class="flex gap-2">
              <input
                v-model="editName"
                type="text"
                class="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-pienter-500"
                @keyup.enter="saveEdit(dg.id)"
                @keyup.escape="editingId = null"
              />
              <input
                v-model="editDesc"
                type="text"
                class="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-pienter-500"
                placeholder="Beschrijving (optioneel)"
                @keyup.enter="saveEdit(dg.id)"
              />
              <button class="text-pienter-600 text-sm font-medium px-2" @click="saveEdit(dg.id)">✓</button>
              <button class="text-gray-400 text-sm px-2" @click="editingId = null">✕</button>
            </div>
            <div v-else>
              <p class="font-medium text-gray-900 text-sm">{{ dg.name }}</p>
              <p v-if="dg.description" class="text-xs text-gray-500 mt-0.5">{{ dg.description }}</p>
            </div>
          </div>
          <div v-if="editingId !== dg.id" class="flex gap-1">
            <button class="text-gray-400 hover:text-gray-600 text-xs px-2 py-1" @click="startEdit(dg)">Bewerken</button>
            <button class="text-red-400 hover:text-red-600 text-xs px-2 py-1" @click="removeDg(dg.id)">Verwijderen</button>
          </div>
        </div>
      </div>

      <!-- Nieuwe doelgroep toevoegen -->
      <div class="bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 p-5">
        <p class="text-sm font-medium text-gray-700 mb-3">Nieuwe doelgroep toevoegen</p>
        <div class="flex gap-2">
          <input
            v-model="newName"
            type="text"
            class="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pienter-500"
            placeholder="Naam van de doelgroep"
            @keyup.enter="addDoelgroep"
          />
          <input
            v-model="newDesc"
            type="text"
            class="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pienter-500"
            placeholder="Beschrijving (optioneel)"
            @keyup.enter="addDoelgroep"
          />
          <button
            class="bg-pienter-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-pienter-700 shrink-0"
            @click="addDoelgroep"
          >
            + Toevoegen
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useProjectStore } from '../../stores/projectStore'
import type { Doelgroep } from '@shared/types'

defineProps<{
  textClass: string
  subtextClass: string
}>()

const projectStore = useProjectStore()

const doelgroepen = computed(() => projectStore.doelgroepen)

const newName = ref('')
const newDesc = ref('')
const editingId = ref<string | null>(null)
const editName = ref('')
const editDesc = ref('')

async function addDoelgroep() {
  if (!newName.value.trim()) return
  const projectId = projectStore.currentProject!.id
  await projectStore.createDoelgroep(projectId, {
    name: newName.value.trim(),
    description: newDesc.value.trim(),
  })
  newName.value = ''
  newDesc.value = ''
}

function startEdit(dg: Doelgroep) {
  editingId.value = dg.id
  editName.value = dg.name
  editDesc.value = dg.description
}

async function saveEdit(id: string) {
  if (!editName.value.trim()) return
  const projectId = projectStore.currentProject!.id
  await projectStore.updateDoelgroep(projectId, id, {
    name: editName.value.trim(),
    description: editDesc.value.trim(),
  })
  editingId.value = null
}

async function removeDg(id: string) {
  const projectId = projectStore.currentProject!.id
  await projectStore.deleteDoelgroep(projectId, id)
}
</script>
