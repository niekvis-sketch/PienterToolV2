import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiFetch } from '../api'
import type { PresentatieSessie, DoelgroepPaspoort } from '@shared/types'

export const usePresentatieStore = defineStore('presentatie', () => {
  const sessies = ref<PresentatieSessie[]>([])
  const currentSessie = ref<PresentatieSessie | null>(null)
  const loading = ref(false)

  async function fetchSessies(projectId: string) {
    loading.value = true
    try {
      sessies.value = await apiFetch<PresentatieSessie[]>('GET', `/presentaties/${projectId}`)
    } finally { loading.value = false }
  }

  async function fetchSessie(projectId: string, sessieId: string) {
    loading.value = true
    try {
      currentSessie.value = await apiFetch<PresentatieSessie>('GET', `/presentaties/${projectId}/${sessieId}`)
    } finally { loading.value = false }
  }

  async function createSessie(projectId: string, data: Partial<PresentatieSessie>) {
    const s = await apiFetch<PresentatieSessie>('POST', `/presentaties/${projectId}`, data)
    sessies.value.push(s)
    currentSessie.value = s
    return s
  }

  async function updateSessie(projectId: string, sessieId: string, data: Partial<PresentatieSessie>) {
    const s = await apiFetch<PresentatieSessie>('PUT', `/presentaties/${projectId}/${sessieId}`, data)
    currentSessie.value = s
    const idx = sessies.value.findIndex(x => x.id === sessieId)
    if (idx >= 0) sessies.value[idx] = s
    return s
  }

  async function deleteSessie(projectId: string, sessieId: string) {
    await apiFetch<{ deleted: boolean }>('DELETE', `/presentaties/${projectId}/${sessieId}`)
    sessies.value = sessies.value.filter(x => x.id !== sessieId)
    if (currentSessie.value?.id === sessieId) currentSessie.value = null
  }

  // Auto-save helper: updates a single field on the current sessie
  async function autoSave(projectId: string, patch: Partial<PresentatieSessie>) {
    if (!currentSessie.value) return
    return updateSessie(projectId, currentSessie.value.id, patch)
  }

  return {
    sessies, currentSessie, loading,
    fetchSessies, fetchSessie, createSessie, updateSessie, deleteSessie,
    autoSave,
  }
})
