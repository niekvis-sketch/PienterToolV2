<template>
  <div class="space-y-6">
    <h2 class="text-xl font-bold text-gray-900">Rapportage en inzicht</h2>

    <!-- Overzichtskaarten -->
    <div class="grid grid-cols-2 gap-4">
      <div class="card p-5">
        <h3 class="font-semibold text-gray-800 mb-3">Projecten</h3>
        <div class="space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-gray-500">Totaal</span>
            <span class="font-semibold">{{ projecten.length }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-500">Met go-live datum</span>
            <span class="font-semibold">{{ projectenMetGoLive.length }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-500">Actieve talen</span>
            <span class="font-semibold">{{ uniekeTalen.join(', ').toUpperCase() || '–' }}</span>
          </div>
        </div>
      </div>

      <div class="card p-5">
        <h3 class="font-semibold text-gray-800 mb-3">Communicatie</h3>
        <div class="space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-gray-500">Totaal contactmomenten</span>
            <span class="font-semibold">{{ store.communicatie.length }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-500">Laatste contact</span>
            <span class="font-semibold">{{ laatsteContact }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-500">Meetings</span>
            <span class="font-semibold">{{ aantalPerType('meeting') }}</span>
          </div>
        </div>
      </div>

      <div class="card p-5">
        <h3 class="font-semibold text-gray-800 mb-3">Commercieel</h3>
        <div class="space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-gray-500">Contractwaarde</span>
            <span class="font-semibold">{{ klant.contractWaarde != null ? formatEuro(klant.contractWaarde) : '–' }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-500">Type contract</span>
            <span class="font-semibold">{{ klant.contractType || '–' }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-500">Betaaltermijn</span>
            <span class="font-semibold">{{ klant.betaaltermijn != null ? `${klant.betaaltermijn} dagen` : '–' }}</span>
          </div>
        </div>
      </div>

      <div class="card p-5">
        <h3 class="font-semibold text-gray-800 mb-3">Klantprofiel</h3>
        <div class="space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-gray-500">Status</span>
            <span class="font-semibold">{{ statusLabel(klant.status) }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-500">Sector</span>
            <span class="font-semibold">{{ klant.sector || '–' }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-500">Klant sinds</span>
            <span class="font-semibold">{{ formatDate(klant.createdAt) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Communicatie per type -->
    <div class="card p-5" v-if="store.communicatie.length > 0">
      <h3 class="font-semibold text-gray-800 mb-4">Contactmomenten per type</h3>
      <div class="grid grid-cols-3 gap-3">
        <div v-for="type in communicatieTypen" :key="type.key" class="text-center py-3 px-4 rounded-lg bg-gray-50">
          <div class="text-2xl">{{ type.icon }}</div>
          <div class="text-xl font-bold text-gray-900 mt-1">{{ aantalPerType(type.key as any) }}</div>
          <div class="text-xs text-gray-500">{{ type.label }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useKlantenStore } from '../../stores/klantenStore'
import { useProjectStore } from '../../stores/projectStore'
import type { KlantStatus, KlantCommunicatieType } from '@shared/types'

const store = useKlantenStore()
const projectStore = useProjectStore()

const klant = computed(() => store.currentKlant!)

const projecten = computed(() =>
  projectStore.projects.filter(p => p.clientName === klant.value.naam)
)
const projectenMetGoLive = computed(() => projecten.value.filter(p => p.goLiveDate))
const uniekeTalen = computed(() => [...new Set(projecten.value.flatMap(p => p.languages))])

const laatsteContact = computed(() => {
  if (store.communicatie.length === 0) return '–'
  return formatDate(store.communicatie[0].datum)
})

const communicatieTypen = [
  { key: 'email', label: 'E-mails', icon: '📧' },
  { key: 'telefoon', label: 'Telefoon', icon: '📞' },
  { key: 'meeting', label: 'Meetings', icon: '🤝' },
  { key: 'notitie', label: 'Notities', icon: '📝' },
  { key: 'offerte', label: 'Offertes', icon: '📄' },
  { key: 'contract', label: 'Contracten', icon: '✍️' },
]

function aantalPerType(type: KlantCommunicatieType): number {
  return store.communicatie.filter(c => c.type === type).length
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatEuro(n: number): string {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(n)
}

function statusLabel(s: KlantStatus): string {
  return { prospect: 'Prospect', actief: 'Actief', inactief: 'Inactief', voormalig: 'Voormalig' }[s] ?? s
}
</script>
