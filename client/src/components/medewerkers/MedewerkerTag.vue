<template>
  <router-link
    v-if="clickable && resolved"
    to="/medewerkers"
    class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gray-100 hover:bg-gray-200 text-xs text-gray-800 transition-colors"
  >
    <MedewerkerAvatar :medewerker="resolved" size="xs" />
    <span class="truncate max-w-[8rem]">{{ resolved.naam }}</span>
  </router-link>
  <span
    v-else-if="resolved"
    class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gray-100 text-xs text-gray-800"
  >
    <MedewerkerAvatar :medewerker="resolved" size="xs" />
    <span class="truncate max-w-[8rem]">{{ resolved.naam }}</span>
  </span>
  <span
    v-else
    class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gray-50 text-xs text-gray-400 italic"
  >
    — Onbekend —
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Medewerker } from '@shared/types'
import { useMedewerkersStore } from '../../stores/medewerkersStore'
import MedewerkerAvatar from './MedewerkerAvatar.vue'

const props = withDefaults(defineProps<{
  medewerkerId: string | null
  clickable?: boolean
}>(), {
  clickable: false,
})

const store = useMedewerkersStore()

const resolved = computed<Medewerker | null>(() =>
  props.medewerkerId ? store.getMedewerker(props.medewerkerId) : null
)
</script>
