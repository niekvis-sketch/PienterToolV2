<template>
  <div>
    <!-- <2 concurrenten -->
    <div v-if="store.totaal < 2" class="empty-state card p-12 text-center">
      <div class="text-4xl mb-3">📊</div>
      <h3 class="text-sm font-semibold text-gray-700">Voeg minstens twee concurrenten toe om te vergelijken</h3>
      <p class="text-xs text-gray-500 mb-4">De matrix laat dan zien welke pagina's en functies vaker terugkomen.</p>
      <button class="btn-secondary btn-sm" @click="store.actieveSubview = 'invoer'">← Naar invoer</button>
    </div>

    <div v-else class="space-y-5">
      <!-- Drempel-filter -->
      <div class="flex items-center gap-2 text-sm">
        <span class="text-gray-500">Filter:</span>
        <button
          class="px-3 py-1 rounded-full border text-xs"
          :class="store.drempel === 1 ? 'bg-pienter-600 text-white border-pienter-600' : 'bg-white border-gray-300 text-gray-600'"
          @click="store.drempel = 1"
        >Toon alles</button>
        <button
          class="px-3 py-1 rounded-full border text-xs"
          :class="store.drempel === 2 ? 'bg-pienter-600 text-white border-pienter-600' : 'bg-white border-gray-300 text-gray-600'"
          @click="store.drempel = 2"
        >≥2 concurrenten</button>
      </div>

      <VergelijkingMatrix
        titel="Pagina's"
        icon="📄"
        :rows="store.paginaAggregaat"
        :concurrenten="store.concurrenten"
        actie-label="Naar structuur"
        doorzet-label="in structuur"
        bekijk-label="Bekijk in Fase 2"
        @actie="onActiePagina"
        @bekijk="onBekijk"
        @loskoppel="onLoskoppel"
      />

      <VergelijkingMatrix
        titel="Functionaliteit"
        icon="⚙️"
        :rows="store.functieAggregaat"
        :concurrenten="store.concurrenten"
        actie-label="Naar vraag"
        doorzet-label="als vraag"
        bekijk-label="Bekijk in Fase 1"
        @actie="onActieFunctie"
        @bekijk="onBekijk"
        @loskoppel="onLoskoppel"
      />
    </div>

    <!-- Bestaat-al confirm (pagina → structuur) -->
    <div v-if="existsConfirm" class="fixed inset-0 bg-black/30 flex items-center justify-center z-50" @click.self="existsConfirm = null">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h3 class="text-lg font-bold mb-2">Pagina bestaat al</h3>
        <p class="text-sm text-gray-600 mb-4">
          Er bestaat al een pagina <strong>{{ existsConfirm.node.title }}</strong> ({{ existsConfirm.node.slug || '/' }}).
          Koppelen aan de bestaande pagina, of toch een nieuwe aanmaken?
        </p>
        <div class="flex flex-wrap gap-2">
          <button class="btn-primary btn-sm" @click="koppelBestaande">Koppelen aan bestaande</button>
          <button class="btn-secondary btn-sm" @click="maakNieuwe">Nieuwe aanmaken</button>
          <button class="btn-secondary btn-sm" @click="existsConfirm = null">Annuleren</button>
        </div>
      </div>
    </div>

    <!-- Naar vraag popover (functie → Fase 1) -->
    <DoorzetVraagPopover
      v-if="vraagRij"
      :rij="vraagRij"
      @close="vraagRij = null"
      @confirm="onVraagConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useConcurrentenStore, type AggregaatRij } from '../../stores/concurrenten'
import { useStructuurStore } from '../../stores/structuurStore'
import type { JourneyFase, SiteNode } from '@shared/types'
import VergelijkingMatrix from './VergelijkingMatrix.vue'
import DoorzetVraagPopover from './DoorzetVraagPopover.vue'

const emit = defineEmits<{ jump: [payload: { doel: 'structuur' | 'vraag'; targetId: string }] }>()

const store = useConcurrentenStore()
const structuur = useStructuurStore()

const existsConfirm = ref<{ rij: AggregaatRij; node: SiteNode } | null>(null)
const vraagRij = ref<AggregaatRij | null>(null)

async function onActiePagina(rij: AggregaatRij) {
  const res = await store.doorzetNaarStructuur(rij)
  if (res.status === 'exists' && res.existingNode) {
    existsConfirm.value = { rij, node: res.existingNode }
  }
}

async function koppelBestaande() {
  if (!existsConfirm.value) return
  await store.koppelAanBestaande(existsConfirm.value.rij, existsConfirm.value.node.id)
  existsConfirm.value = null
}
async function maakNieuwe() {
  if (!existsConfirm.value) return
  await store.maakNieuweStructuurNode(existsConfirm.value.rij)
  existsConfirm.value = null
}

function onActieFunctie(rij: AggregaatRij) {
  vraagRij.value = rij
}
async function onVraagConfirm(payload: { doelgroepId: string; fase: JourneyFase; text: string }) {
  if (!vraagRij.value) return
  await store.doorzetNaarVraag(vraagRij.value, payload.doelgroepId, payload.fase, payload.text)
  vraagRij.value = null
}

async function onLoskoppel(rij: AggregaatRij) {
  if (rij.doorzet) await store.verwijderDoorzet(rij.doorzet.id)
}

function onBekijk(rij: AggregaatRij) {
  if (!rij.doorzet) return
  if (rij.doorzet.doel === 'structuur') {
    structuur.selectedNodeId = rij.doorzet.targetId
  }
  emit('jump', { doel: rij.doorzet.doel, targetId: rij.doorzet.targetId })
}
</script>
