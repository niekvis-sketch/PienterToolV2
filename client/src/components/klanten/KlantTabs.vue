<template>
  <DetailLayout :tabs="tabs" v-model="activeTab">
    <KlantProjectenTab v-if="activeTab === 'diensten'" />
    <KlantInformatieTab v-else-if="activeTab === 'informatie'" />
    <CommercieleInformatieTab v-else-if="activeTab === 'commercieel'" />
    <KlantDoelenTab v-else-if="activeTab === 'doelen'" />
  </DetailLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import DetailLayout from '../DetailLayout.vue'
import KlantProjectenTab from './KlantProjectenTab.vue'
import KlantInformatieTab from './KlantInformatieTab.vue'
import CommercieleInformatieTab from './CommercieleInformatieTab.vue'
import KlantDoelenTab from './KlantDoelenTab.vue'

const activeTab = ref('diensten')

const tabs = [
  { key: 'diensten', label: 'Diensten', icon: '📁' },
  { key: 'informatie', label: 'Klantinformatie', icon: '🏢' },
  { key: 'commercieel', label: 'Commerciële informatie', icon: '💼' },
  { key: 'doelen', label: 'Doelen', icon: '🎯' },
] as const
</script>
