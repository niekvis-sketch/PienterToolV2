<template>
  <div
    class="inline-flex items-center justify-center rounded-full font-semibold text-white shrink-0 overflow-hidden"
    :class="[bgClass, sizeClasses.box]"
    :title="resolved?.naam || '— Onbekend —'"
  >
    <img
      v-if="resolved?.avatarPath"
      :src="`/api/uploads/${resolved.avatarPath}`"
      :alt="resolved.naam"
      class="w-full h-full object-cover"
    />
    <span v-else :class="sizeClasses.text">{{ initials }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Medewerker, Team } from '@shared/types'
import { useMedewerkersStore } from '../../stores/medewerkersStore'

const props = withDefaults(defineProps<{
  medewerker?: Medewerker | null
  medewerkerId?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg'
}>(), {
  medewerker: null,
  medewerkerId: null,
  size: 'md',
})

const store = useMedewerkersStore()

const resolved = computed<Medewerker | null>(() => {
  if (props.medewerker) return props.medewerker
  if (props.medewerkerId) return store.getMedewerker(props.medewerkerId)
  return null
})

const initials = computed(() => {
  const naam = resolved.value?.naam?.trim()
  if (!naam) return '?'
  const parts = naam.split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
})

const teamColors: Record<Team, string> = {
  seo: 'bg-blue-500',
  content: 'bg-emerald-500',
  advertising: 'bg-orange-500',
  website: 'bg-purple-500',
  overig: 'bg-gray-400',
}

const bgClass = computed(() => {
  if (!resolved.value) return 'bg-gray-300'
  return teamColors[resolved.value.team] ?? 'bg-gray-400'
})

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'xs': return { box: 'w-5 h-5', text: 'text-[9px]' }
    case 'sm': return { box: 'w-7 h-7', text: 'text-[10px]' }
    case 'lg': return { box: 'w-12 h-12', text: 'text-base' }
    case 'md':
    default:   return { box: 'w-9 h-9', text: 'text-xs' }
  }
})
</script>
