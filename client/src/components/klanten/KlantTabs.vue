<template>
  <DetailLayout :tabs="tabs" v-model="activeTab">
    <KlantOverzichtTab v-if="activeTab === 'overzicht'" />
    <KlantInformatieTab v-else-if="activeTab === 'informatie'" />
    <KlantProjectenTab v-else-if="activeTab === 'projecten'" />
    <CommercieleInformatieTab v-else-if="activeTab === 'commercieel'" />
    <StrategischeInformatieTab v-else-if="activeTab === 'strategisch'" />
    <CommunicatieHistorieTab v-else-if="activeTab === 'communicatie'" />
    <RapportageInzichtTab v-else-if="activeTab === 'rapportage'" />
  </DetailLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import DetailLayout from '../DetailLayout.vue'
import KlantOverzichtTab from './KlantOverzichtTab.vue'
import KlantInformatieTab from './KlantInformatieTab.vue'
import KlantProjectenTab from './KlantProjectenTab.vue'
import CommercieleInformatieTab from './CommercieleInformatieTab.vue'
import StrategischeInformatieTab from './StrategischeInformatieTab.vue'
import CommunicatieHistorieTab from './CommunicatieHistorieTab.vue'
import RapportageInzichtTab from './RapportageInzichtTab.vue'

const activeTab = ref('overzicht')

const tabs = [
  { key: 'overzicht', label: 'Klantoverzicht', icon: '📊' },
  { key: 'informatie', label: 'Klantinformatie', icon: '🏢' },
  { key: 'projecten', label: 'Projecten', icon: '📁' },
  { key: 'commercieel', label: 'Commerciële', icon: '💼' },
  { key: 'strategisch', label: 'Strategische', icon: '🎯' },
  { key: 'communicatie', label: 'Communicatie', icon: '💬' },
  { key: 'rapportage', label: 'Rapportage', icon: '📈' },
] as const
</script>
