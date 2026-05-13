<template>
  <DetailLayout>
    <div class="flex items-end justify-between mb-6">
      <div>
        <p class="eyebrow">Overzicht</p>
        <h1 class="text-3xl font-bold tracking-tight text-pienter-700 mt-1 flex items-baseline gap-2">
          Klanten<span class="accent-dot"></span>
        </h1>
        <p class="text-ink-3 text-sm mt-2">Overzicht van alle klanten</p>
      </div>
      <router-link to="/klanten/new" class="btn btn-primary">Nieuwe klant</router-link>
    </div>

    <!-- Loading -->
    <div v-if="store.loading" class="text-center py-16 text-ink-mute">Laden...</div>

    <!-- Lege staat -->
    <div v-else-if="store.klanten.length === 0" class="empty-state">
      <div class="text-4xl mb-4">🏢</div>
      <h2 class="text-lg font-semibold text-ink-2">Nog geen klanten</h2>
      <p>Maak een nieuwe klant aan om te beginnen.</p>
      <div class="mt-6 flex justify-center">
        <router-link to="/klanten/new" class="btn btn-primary">Nieuwe klant</router-link>
      </div>
    </div>

    <!-- Klant cards -->
    <div v-else class="grid gap-3">
      <router-link
        v-for="klant in store.klanten"
        :key="klant.id"
        :to="`/klanten/${klant.id}`"
        class="klant-card block"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0">
            <h3 class="font-semibold text-ink truncate">{{ klant.naam }}</h3>
            <p class="text-sm text-ink-3 mt-1">{{ klant.contactpersoon || 'Geen contactpersoon' }}</p>
          </div>
          <div class="flex items-center gap-3 shrink-0">
            <span class="badge" :class="statusClass(klant.status)">
              {{ statusLabel(klant.status) }}
            </span>
            <span class="text-xs text-ink-mute">{{ formatDate(klant.createdAt) }}</span>
          </div>
        </div>
        <div class="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-3">
          <span v-if="klant.sector">{{ klant.sector }}</span>
          <span v-if="klant.sector && klant.stad" class="text-ink-mute">·</span>
          <span v-if="klant.stad">{{ klant.stad }}</span>
          <span v-if="klant.email" class="text-ink-mute">·</span>
          <span v-if="klant.email">{{ klant.email }}</span>
        </div>
      </router-link>
    </div>
  </DetailLayout>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useKlantenStore } from '../stores/klantenStore'
import DetailLayout from '../components/DetailLayout.vue'
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
    prospect: 'badge-primary',
    actief: 'badge-done',
    inactief: 'badge-todo',
    voormalig: 'badge-blocked',
  }[s] ?? 'badge-todo'
}
</script>

<style scoped>
.klant-card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--r-3);
  padding: 16px 18px;
  transition: border-color .15s, box-shadow .15s, transform .12s;
}
.klant-card:hover {
  border-color: color-mix(in srgb, var(--primary) 35%, var(--line));
  box-shadow: var(--shadow-2, 0 6px 16px -6px rgba(20,36,27,0.10));
  transform: translateY(-1px);
}
</style>
