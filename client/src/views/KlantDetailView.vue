<template>
  <div v-if="!store.currentKlant" class="text-center py-16 text-gray-400">Laden...</div>
  <div v-else class="flex h-[calc(100vh-57px)]">
    <!-- Sidebar -->
    <aside class="w-64 bg-white border-r border-gray-200 shrink-0 flex flex-col">
      <div class="p-4 border-b border-gray-100">
        <h2 class="font-semibold text-gray-900 text-sm leading-tight">{{ store.currentKlant.naam }}</h2>
        <p class="text-xs mt-1 font-medium px-2 py-0.5 rounded-full inline-block" :class="statusClass(store.currentKlant.status)">
          {{ statusLabel(store.currentKlant.status) }}
        </p>
      </div>
      <nav class="flex-1 p-2 space-y-0.5">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2.5 transition-colors"
          :class="activeTab === tab.key ? 'bg-pienter-50 text-pienter-700 font-medium' : 'text-gray-600 hover:bg-gray-50'"
          @click="activeTab = tab.key"
        >
          <span class="text-base">{{ tab.icon }}</span>
          {{ tab.label }}
        </button>
      </nav>
    </aside>

    <!-- Content area -->
    <div class="flex-1 overflow-y-auto bg-gray-50">
      <div class="p-6">
        <KlantOverzichtTab v-if="activeTab === 'overzicht'" />
        <KlantInformatieTab v-else-if="activeTab === 'informatie'" />
        <KlantProjectenTab v-else-if="activeTab === 'projecten'" />
        <CommercieleInformatieTab v-else-if="activeTab === 'commercieel'" />
        <StrategischeInformatieTab v-else-if="activeTab === 'strategisch'" />
        <CommunicatieHistorieTab v-else-if="activeTab === 'communicatie'" />
        <RapportageInzichtTab v-else-if="activeTab === 'rapportage'" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useKlantenStore } from '../stores/klantenStore'
import { useProjectStore } from '../stores/projectStore'
import KlantOverzichtTab from '../components/klanten/KlantOverzichtTab.vue'
import KlantInformatieTab from '../components/klanten/KlantInformatieTab.vue'
import KlantProjectenTab from '../components/klanten/KlantProjectenTab.vue'
import CommercieleInformatieTab from '../components/klanten/CommercieleInformatieTab.vue'
import StrategischeInformatieTab from '../components/klanten/StrategischeInformatieTab.vue'
import CommunicatieHistorieTab from '../components/klanten/CommunicatieHistorieTab.vue'
import RapportageInzichtTab from '../components/klanten/RapportageInzichtTab.vue'
import type { KlantStatus } from '@shared/types'

const props = defineProps<{ id: string }>()
const store = useKlantenStore()
const projectStore = useProjectStore()
const activeTab = ref('overzicht')

const tabs = [
  { key: 'overzicht', label: 'Klantoverzicht', icon: '📊' },
  { key: 'informatie', label: 'Klantinformatie', icon: '🏢' },
  { key: 'projecten', label: 'Projecten', icon: '📁' },
  { key: 'commercieel', label: 'Commerciële informatie', icon: '💼' },
  { key: 'strategisch', label: 'Strategische informatie', icon: '🎯' },
  { key: 'communicatie', label: 'Communicatie en historie', icon: '💬' },
  { key: 'rapportage', label: 'Rapportage en inzicht', icon: '📈' },
]

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

async function loadAll() {
  await store.fetchKlant(props.id)
  await Promise.all([
    store.fetchCommunicatie(props.id),
    projectStore.fetchProjects(),
  ])
}

onMounted(loadAll)
watch(() => props.id, loadAll)
</script>
