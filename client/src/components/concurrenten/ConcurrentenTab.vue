<template>
  <div>
    <!-- Header + sub-view switcher -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-xl font-bold text-gray-900 mb-1">Concurrenten</h2>
        <p class="text-sm text-gray-500">Leg per concurrent vast welke pagina's en functionaliteit ze hebben, vergelijk, en zet bevindingen door naar Fase 1 of 2.</p>
      </div>
      <div class="flex gap-1 shrink-0">
        <button
          class="px-4 py-2 rounded-lg text-sm font-medium border transition-colors"
          :class="store.actieveSubview === 'invoer' ? 'bg-pienter-600 text-white border-pienter-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'"
          @click="store.actieveSubview = 'invoer'"
        >Invoer</button>
        <button
          class="px-4 py-2 rounded-lg text-sm font-medium border transition-colors"
          :class="store.actieveSubview === 'vergelijking' ? 'bg-pienter-600 text-white border-pienter-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'"
          @click="store.actieveSubview = 'vergelijking'"
        >Vergelijking</button>
      </div>
    </div>

    <!-- Foutmelding -->
    <div v-if="store.error" class="mb-4 px-4 py-2.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex items-center justify-between">
      <span>{{ store.error }}</span>
      <button class="text-red-400 hover:text-red-600" @click="store.error = null">✕</button>
    </div>

    <div v-if="store.loading" class="text-sm text-gray-400 py-8 text-center">Laden…</div>
    <template v-else>
      <ConcurrentInvoer v-if="store.actieveSubview === 'invoer'" />
      <ConcurrentVergelijking v-else @jump="onJump" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useConcurrentenStore } from '../../stores/concurrenten'
import { useProjectStore } from '../../stores/projectStore'
import { useStructuurStore } from '../../stores/structuurStore'
import ConcurrentInvoer from './ConcurrentInvoer.vue'
import ConcurrentVergelijking from './ConcurrentVergelijking.vue'

const emit = defineEmits<{ navigate: [tab: string] }>()

const store = useConcurrentenStore()
const project = useProjectStore()
const structuur = useStructuurStore()

onMounted(() => {
  if (project.currentProject) store.fetch(project.currentProject.id)
})

// Spring naar Fase 1 (vraag) of Fase 2 (structuur) in de Structuur-tab.
async function onJump(payload: { doel: 'structuur' | 'vraag'; targetId: string }) {
  const pid = project.currentProject?.id
  if (!pid) return
  const fase = payload.doel === 'structuur' ? 2 : 1
  // Zorg dat progress bestaat (GET maakt aan indien nodig), zet dan de fase.
  await structuur.fetchProgress(pid)
  await structuur.updateProgress(pid, { currentFase: fase })
  emit('navigate', 'structuur')
}
</script>
