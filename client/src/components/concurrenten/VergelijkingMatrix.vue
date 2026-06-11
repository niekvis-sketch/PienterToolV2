<template>
  <div class="card p-0 overflow-hidden">
    <div class="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
      <h4 class="text-sm font-semibold text-gray-800">{{ icon }} {{ titel }}</h4>
      <span class="text-xs text-gray-400">{{ rows.length }} {{ rows.length === 1 ? 'rij' : 'rijen' }}</span>
    </div>

    <div v-if="rows.length === 0" class="p-6 text-center text-sm text-gray-400">
      Geen {{ titel.toLowerCase() }} die aan het filter voldoen.
    </div>

    <div v-else class="overflow-x-auto">
      <table class="w-full text-sm border-collapse">
        <thead>
          <tr class="bg-gray-50 text-xs text-gray-500">
            <th class="text-left font-medium px-4 py-2 sticky left-0 bg-gray-50 min-w-[180px]">Label</th>
            <th v-for="c in concurrenten" :key="c.id" class="font-medium px-2 py-2 text-center max-w-[90px]">
              <span class="block truncate" :title="c.naam">{{ c.naam }}</span>
            </th>
            <th class="font-medium px-3 py-2 text-center whitespace-nowrap">komt voor</th>
            <th class="font-medium px-3 py-2 text-right min-w-[150px]">actie</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="rij in rows" :key="rij.key" class="border-t border-gray-100 hover:bg-gray-50/60">
            <td class="px-4 py-2 sticky left-0 bg-white font-medium text-gray-800">{{ rij.label }}</td>
            <td v-for="c in concurrenten" :key="c.id" class="px-2 py-2 text-center">
              <span v-if="rij.aanwezigBij.includes(c.id)" class="text-green-600">✓</span>
              <span v-else class="text-gray-300">–</span>
            </td>
            <td class="px-3 py-2 text-center">
              <span
                class="text-xs font-medium px-2 py-0.5 rounded-full"
                :class="rij.aantal >= 2 ? 'bg-pienter-100 text-pienter-700' : 'bg-gray-100 text-gray-500'"
              >{{ rij.aantal }}/{{ rij.totaal }}</span>
            </td>
            <td class="px-3 py-2 text-right whitespace-nowrap">
              <template v-if="rij.doorzet">
                <span class="text-xs text-green-700 font-medium mr-1">✓ {{ doorzetLabel }}</span>
                <button class="text-xs text-pienter-600 hover:underline" @click="$emit('bekijk', rij)">{{ bekijkLabel }} →</button>
                <button class="text-xs text-gray-300 hover:text-red-500 ml-1.5" title="Koppeling ongedaan maken" @click="$emit('loskoppel', rij)">✕</button>
              </template>
              <button v-else class="btn-secondary btn-sm" @click="$emit('actie', rij)">{{ actieLabel }}</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Concurrent } from '@shared/types'
import type { AggregaatRij } from '../../stores/concurrenten'

defineProps<{
  titel: string
  icon: string
  rows: AggregaatRij[]
  concurrenten: Concurrent[]
  actieLabel: string
  doorzetLabel: string
  bekijkLabel: string
}>()

defineEmits<{
  actie: [rij: AggregaatRij]
  bekijk: [rij: AggregaatRij]
  loskoppel: [rij: AggregaatRij]
}>()
</script>
