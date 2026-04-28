<template>
  <div class="max-w-5xl mx-auto px-6 py-8">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Klanten</h1>
        <p class="text-gray-500 text-sm mt-1">Overzicht van alle klanten</p>
      </div>
      <div class="flex items-center gap-2">
        <router-link to="/slides" class="btn-secondary">🎞️ Vrije slides</router-link>
        <router-link to="/klanten/new" class="btn-primary">Nieuwe klant</router-link>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="store.loading" class="text-center py-16 text-gray-400">Laden...</div>

    <!-- Lege staat -->
    <div v-else-if="store.klanten.length === 0" class="empty-state card p-12 text-center">
      <div class="text-4xl mb-4">🏢</div>
      <h2 class="text-lg font-semibold text-gray-700">Nog geen klanten</h2>
      <p class="text-gray-500 mt-1">Maak een nieuwe klant aan om te beginnen.</p>
      <div class="mt-6 flex justify-center">
        <router-link to="/klanten/new" class="btn-primary">Nieuwe klant</router-link>
      </div>
    </div>

    <!-- Klant cards -->
    <div v-else class="grid gap-4">
      <router-link
        v-for="klant in store.klanten"
        :key="klant.id"
        :to="`/klanten/${klant.id}`"
        class="card p-5 hover:border-pienter-300 hover:shadow-md transition-all block"
      >
        <div class="flex items-start justify-between">
          <div>
            <h3 class="font-semibold text-gray-900">{{ klant.naam }}</h3>
            <p class="text-sm text-gray-500 mt-1">{{ klant.contactpersoon || 'Geen contactpersoon' }}</p>
          </div>
          <div class="flex items-center gap-3">
            <span class="badge text-xs px-2 py-0.5 rounded-full font-medium" :class="statusClass(klant.status)">
              {{ statusLabel(klant.status) }}
            </span>
            <span class="text-xs text-gray-400">{{ formatDate(klant.createdAt) }}</span>
          </div>
        </div>
        <div class="mt-3 flex gap-3 text-xs text-gray-500">
          <span v-if="klant.sector">{{ klant.sector }}</span>
          <span v-if="klant.sector && klant.stad">·</span>
          <span v-if="klant.stad">{{ klant.stad }}</span>
          <span v-if="klant.email">&middot; {{ klant.email }}</span>
        </div>
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useKlantenStore } from '../stores/klantenStore'
import type { KlantStatus } from '@shared/types'

const store = useKlantenStore()

onMounted(() => {
  store.fetchKlanten()
})

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
}

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
</script>
