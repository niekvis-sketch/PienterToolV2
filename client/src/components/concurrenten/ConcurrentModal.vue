<template>
  <div class="fixed inset-0 bg-black/30 flex items-center justify-center z-50" @click.self="$emit('close')">
    <div class="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
      <h3 class="text-lg font-bold mb-4">{{ concurrent ? 'Concurrent bewerken' : 'Nieuwe concurrent' }}</h3>
      <div class="space-y-4">
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Naam *</label>
          <input
            ref="naamInput"
            v-model="naam"
            class="input"
            placeholder="bijv. Bouwbedrijf Jansen"
            @keyup.enter="submit"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Website (optioneel)</label>
          <input v-model="url" class="input" placeholder="https://..." @keyup.enter="submit" />
          <p v-if="urlWarning" class="text-xs text-amber-600 mt-1">{{ urlWarning }}</p>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Notitie (optioneel)</label>
          <textarea v-model="notitie" class="textarea" rows="2" placeholder="Korte notitie over deze concurrent" />
        </div>
      </div>
      <div class="flex gap-3 mt-6">
        <button class="btn-primary" :disabled="!naam.trim()" @click="submit">{{ concurrent ? 'Opslaan' : 'Toevoegen' }}</button>
        <button class="btn-secondary" @click="$emit('close')">Annuleren</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import type { Concurrent } from '@shared/types'
import { normalizeUrl } from './urlUtils'

const props = defineProps<{ concurrent?: Concurrent | null }>()
const emit = defineEmits<{ submit: [payload: { naam: string; url: string; notitie: string }]; close: [] }>()

const naam = ref(props.concurrent?.naam ?? '')
const url = ref(props.concurrent?.url ?? '')
const notitie = ref(props.concurrent?.notitie ?? '')
const naamInput = ref<HTMLInputElement | null>(null)

const urlWarning = computed(() => {
  if (!url.value.trim()) return ''
  const norm = normalizeUrl(url.value)
  return norm ? '' : 'Dit lijkt geen geldige URL — wordt toch opgeslagen.'
})

onMounted(async () => {
  await nextTick()
  naamInput.value?.focus()
})

function submit() {
  if (!naam.value.trim()) return
  emit('submit', {
    naam: naam.value.trim(),
    url: normalizeUrl(url.value) || url.value.trim(),
    notitie: notitie.value.trim(),
  })
}
</script>
