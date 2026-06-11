<template>
  <DetailLayout :tabs="tabs" v-model="activeTab">
    <DoelgroepenTab v-if="activeTab === 'doelgroepen'" />
    <ConcurrentenTab v-else-if="activeTab === 'concurrenten'" @navigate="activeTab = $event" />
    <StructuurTab v-else-if="activeTab === 'structuur'" />
    <ContentStructuurTab v-else-if="activeTab === 'contentStructuur'" />
    <ComponentenTab v-else-if="activeTab === 'componenten'" />
    <InstellingenTab v-else-if="activeTab === 'instellingen'" />
  </DetailLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import DetailLayout from '../DetailLayout.vue'
import StructuurTab from '../tabs/StructuurTab.vue'
import InstellingenTab from '../tabs/InstellingenTab.vue'
import DoelgroepenTab from '../tabs/DoelgroepenTab.vue'
import ComponentenTab from '../tabs/ComponentenTab.vue'
import ContentStructuurTab from '../tabs/ContentStructuurTab.vue'
import ConcurrentenTab from '../concurrenten/ConcurrentenTab.vue'

const activeTab = ref('doelgroepen')

const tabs = [
  { key: 'doelgroepen', label: 'Doelgroepen', icon: '🎯' },
  { key: 'concurrenten', label: 'Concurrenten', icon: '🏢' },
  { key: 'structuur', label: 'Structuur', icon: '🗂️' },
  { key: 'contentStructuur', label: 'Content', icon: '📝' },
  { key: 'componenten', label: 'Componenten', icon: '🧩' },
  { key: 'instellingen', label: 'Instellingen', icon: '⚙️' },
] as const
</script>
