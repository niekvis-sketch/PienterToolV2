<template>
  <div class="fixed inset-0 bg-black/30 flex items-center justify-center z-50" @click.self="$emit('close')">
    <div class="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
      <h3 class="text-lg font-bold mb-1">Naar vraag (Fase 1)</h3>
      <p class="text-xs text-gray-500 mb-4">Een functie is niet aan een doelgroep gekoppeld — kies hieronder waar de vraag bij hoort.</p>

      <div class="space-y-4">
        <!-- Doelgroep -->
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Doelgroep</label>
          <div v-if="doelgroepen.length === 0" class="flex items-center gap-2">
            <span class="text-sm text-gray-400">Nog geen doelgroepen.</span>
            <button class="btn-secondary btn-sm" @click="maakAlgemeen">Maak doelgroep 'Algemeen'</button>
          </div>
          <select v-else v-model="doelgroepId" class="select">
            <option v-for="d in doelgroepen" :key="d.id" :value="d.id">{{ d.name }}</option>
          </select>
        </div>

        <!-- Journey-fase -->
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Journey-fase</label>
          <select v-model="fase" class="select">
            <option value="see">See / Oriëntatie</option>
            <option value="think">Think / Overweging</option>
            <option value="do">Do / Kiezen</option>
            <option value="care">Care / Behoud</option>
          </select>
          <p class="text-xs text-gray-400 mt-1">Standaard <strong>Do</strong> — pas aan als de functie eerder in de reis hoort.</p>
        </div>

        <!-- Vraagtekst -->
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Vraag</label>
          <textarea v-model="text" class="textarea text-sm" rows="3" />
        </div>
      </div>

      <div class="flex gap-3 mt-6">
        <button class="btn-primary" :disabled="!doelgroepId || !text.trim()" @click="confirm">Doorzetten</button>
        <button class="btn-secondary" @click="$emit('close')">Annuleren</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useProjectStore } from '../../stores/projectStore'
import type { JourneyFase } from '@shared/types'
import type { AggregaatRij } from '../../stores/concurrenten'

const props = defineProps<{ rij: AggregaatRij }>()
const emit = defineEmits<{ confirm: [payload: { doelgroepId: string; fase: JourneyFase; text: string }]; close: [] }>()

const project = useProjectStore()
const doelgroepen = project.doelgroepen

const doelgroepId = ref<string>(doelgroepen.length > 0 ? doelgroepen[0].id : '')
const fase = ref<JourneyFase>('do')
const text = ref(`${props.rij.label} — wil de klant dit ook? (gezien bij ${props.rij.aantal} van ${props.rij.totaal} concurrenten)`)

onMounted(async () => {
  // Doelgroepen kunnen ontbreken als de gebruiker de Doelgroepen-tab nog niet opende.
  if (doelgroepen.length === 0 && project.currentProject) {
    await project.fetchDoelgroepen(project.currentProject.id)
    if (project.doelgroepen.length > 0) doelgroepId.value = project.doelgroepen[0].id
  }
})

async function maakAlgemeen() {
  if (!project.currentProject) return
  const dg = await project.createDoelgroep(project.currentProject.id, { name: 'Algemeen', description: 'Automatisch aangemaakt vanuit concurrentie-analyse' })
  doelgroepId.value = dg.id
}

function confirm() {
  if (!doelgroepId.value || !text.value.trim()) return
  emit('confirm', { doelgroepId: doelgroepId.value, fase: fase.value, text: text.value.trim() })
}
</script>
