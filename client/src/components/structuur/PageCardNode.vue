<template>
  <div class="w-60 overflow-hidden rounded-lg border border-pienter-200 bg-white shadow-sm">
    <!-- Verbindingspunten (onzichtbaar, voor de edges) -->
    <Handle type="target" :position="Position.Top" class="!opacity-0" />
    <Handle type="source" :position="Position.Bottom" class="!opacity-0" />

    <!-- Kop = paginatitel -->
    <div class="bg-pienter-100 px-3 py-2 border-b border-pienter-200">
      <div class="truncate text-sm font-semibold text-pienter-900">{{ data.title || 'Naamloos' }}</div>
      <div v-if="data.fullUrl" class="truncate font-mono text-[10px] text-pienter-500">{{ data.fullUrl }}</div>
      <span
        v-if="data.aanname"
        class="inline-block mt-1 rounded-full bg-amber-100 border border-amber-200 px-1.5 py-0.5 text-[9px] font-medium text-amber-700"
        title="Uit concurrentie-analyse, nog niet bevestigd door de klant"
      >aanname</span>
    </div>

    <!-- Blokken -->
    <div class="space-y-1 p-2">
      <p v-if="data.blocks.length === 0" class="px-1 py-2 text-center text-[11px] italic text-gray-400">
        Nog geen blokken
      </p>
      <div
        v-for="b in data.blocks" :key="b.id"
        class="rounded-md border border-blue-100 bg-blue-50/70 px-2 py-1"
        :title="b.goal || ''"
      >
        <div class="truncate text-[11px] font-medium text-gray-800">{{ b.name }}</div>
        <div v-if="b.type" class="truncate text-[10px] text-blue-500">{{ b.type }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'

interface CardBlock { id: string; name: string; type: string; goal: string }
defineProps<{
  data: { title: string; fullUrl: string; blocks: CardBlock[]; aanname?: boolean }
}>()
</script>
