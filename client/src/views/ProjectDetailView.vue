<template>
  <div v-if="!store.currentProject" class="text-center py-16 text-gray-400">Laden...</div>
  <div v-else class="flex h-[calc(100vh-57px)]">
    <!-- Sidebar -->
    <aside class="w-64 bg-white border-r border-gray-200 shrink-0 flex flex-col">
      <nav class="flex-1 p-2 pt-3 space-y-0.5">
        <!-- Projecten parent item -->
        <div class="px-3 py-2 flex items-center gap-2.5 text-sm text-gray-500">
          <span class="text-base">📁</span>
          <span class="font-medium text-gray-700">{{ store.currentProject.name }}</span>
        </div>

        <!-- Tabs als child items, ingesprongen -->
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="w-full text-left pl-9 pr-3 py-2 rounded-lg text-sm flex items-center gap-2.5 transition-colors"
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
        <DoelgroepenTab v-if="activeTab === 'doelgroepen'" />
        <StructuurTab v-else-if="activeTab === 'structuur'" />
        <ContentStructuurTab v-else-if="activeTab === 'contentStructuur'" />
        <ComponentenTab v-else-if="activeTab === 'componenten'" />
        <PresentatieTab v-else-if="activeTab === 'presentatie'" />
        <InstellingenTab v-else-if="activeTab === 'instellingen'" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useProjectStore } from '../stores/projectStore'
import StructuurTab from '../components/tabs/StructuurTab.vue'
import InstellingenTab from '../components/tabs/InstellingenTab.vue'
import DoelgroepenTab from '../components/tabs/DoelgroepenTab.vue'
import ComponentenTab from '../components/tabs/ComponentenTab.vue'
import ContentStructuurTab from '../components/tabs/ContentStructuurTab.vue'
import PresentatieTab from '../components/tabs/PresentatieTab.vue'

const props = defineProps<{ id: string }>()
const store = useProjectStore()
const activeTab = ref('doelgroepen')

const tabs = [
  { key: 'doelgroepen', label: 'Doelgroepen', icon: '🎯' },
  { key: 'structuur', label: 'Structuur', icon: '🗂️' },
  { key: 'contentStructuur', label: 'Content', icon: '📝' },
  { key: 'componenten', label: 'Componenten', icon: '🧩' },
  { key: 'presentatie', label: 'Presentatie', icon: '🎬' },
  { key: 'instellingen', label: 'Instellingen', icon: '⚙️' },
]

async function loadAll() {
  await store.fetchProject(props.id)
  await Promise.all([
    store.fetchPages(props.id),
    store.fetchDoelgroepen(props.id),
    store.fetchComponenten(props.id),
  ])
}

onMounted(loadAll)
watch(() => props.id, loadAll)
</script>
