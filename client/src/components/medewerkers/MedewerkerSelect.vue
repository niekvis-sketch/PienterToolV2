<template>
  <select
    :value="modelValue ?? ''"
    class="px-2 py-1.5 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-pienter-500 focus:border-transparent"
    @change="onChange"
  >
    <option v-if="allowNull" value="">{{ placeholder || '— Geen —' }}</option>
    <option
      v-for="m in options"
      :key="m.id"
      :value="m.id"
    >
      [{{ teamLabel(m.team) }}] {{ m.naam }}
    </option>
  </select>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import type { Medewerker, Team } from '@shared/types'
import { useMedewerkersStore } from '../../stores/medewerkersStore'

const props = withDefaults(defineProps<{
  modelValue: string | null
  team?: Team | null
  allowNull?: boolean
  placeholder?: string
}>(), {
  team: null,
  allowNull: false,
  placeholder: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
}>()

const store = useMedewerkersStore()

onMounted(() => {
  store.fetchMedewerkers()
})

const options = computed<Medewerker[]>(() => {
  const list = store.medewerkers
  const filtered = props.team ? list.filter(m => m.team === props.team) : list
  return [...filtered].sort((a, b) => a.naam.localeCompare(b.naam))
})

const teamLabels: Record<Team, string> = {
  seo: 'SEO',
  content: 'Content',
  advertising: 'Ads',
  website: 'Website',
  overig: 'Overig',
}

function teamLabel(t: Team): string {
  return teamLabels[t] ?? t
}

function onChange(e: Event) {
  const v = (e.target as HTMLSelectElement).value
  emit('update:modelValue', v === '' ? null : v)
}
</script>
