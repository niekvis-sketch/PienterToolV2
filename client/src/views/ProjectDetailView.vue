<template>
  <div v-if="!store.currentProject" class="text-center py-16 text-gray-400">Laden...</div>
  <div v-else class="flex h-[calc(100vh-57px)]">
    <!-- Sidebar -->
    <aside class="w-64 bg-white border-r border-gray-200 shrink-0 flex flex-col">
      <div class="p-4 border-b border-gray-100">
        <router-link to="/" class="text-xs text-pienter-600 hover:underline">← Alle projecten</router-link>
        <h2 class="font-semibold text-gray-900 mt-2 text-sm leading-tight">{{ store.currentProject.name }}</h2>
        <p class="text-xs text-gray-500 mt-0.5">{{ store.currentProject.clientName }}</p>
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
        <OverzichtTab v-if="activeTab === 'overzicht'" />
        <DoelgroepenTab v-else-if="activeTab === 'doelgroepen'" />
        <StructuurTab v-else-if="activeTab === 'structuur'" />
        <TakenTab v-else-if="activeTab === 'taken'" />
        <BronnenTab v-else-if="activeTab === 'bronnen'" />
        <MediaTab v-else-if="activeTab === 'media'" />
        <AuditTab v-else-if="activeTab === 'audit'" />
        <InstellingenTab v-else-if="activeTab === 'instellingen'" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useProjectStore } from '../stores/projectStore'
import OverzichtTab from '../components/tabs/OverzichtTab.vue'
import StructuurTab from '../components/tabs/StructuurTab.vue'
import TakenTab from '../components/tabs/TakenTab.vue'
import BronnenTab from '../components/tabs/BronnenTab.vue'
import MediaTab from '../components/tabs/MediaTab.vue'
import AuditTab from '../components/tabs/AuditTab.vue'
import InstellingenTab from '../components/tabs/InstellingenTab.vue'
import DoelgroepenTab from '../components/tabs/DoelgroepenTab.vue'

const props = defineProps<{ id: string }>()
const store = useProjectStore()
const activeTab = ref('overzicht')

const tabs = [
  { key: 'overzicht', label: 'Overzicht', icon: '📊' },
  { key: 'doelgroepen', label: 'Doelgroepen', icon: '🎯' },
  { key: 'structuur', label: 'Structuur', icon: '🗂️' },
  { key: 'taken', label: 'Taken', icon: '✅' },
  { key: 'bronnen', label: 'Bronnen', icon: '📄' },
  { key: 'media', label: 'Media', icon: '🖼️' },
  { key: 'audit', label: 'Pre-live check', icon: '🔍' },
  { key: 'instellingen', label: 'Instellingen', icon: '⚙️' },
]

async function loadAll() {
  await store.fetchProject(props.id)
  // Laad alle sub-data parallel
  await Promise.all([
    store.fetchPages(props.id),
    store.fetchTasks(props.id),
    store.fetchSources(props.id),
    store.fetchMedia(props.id),
    store.fetchAuditRuns(props.id),
    store.fetchDoelgroepen(props.id),
  ])
}

onMounted(loadAll)
watch(() => props.id, loadAll)
</script>
