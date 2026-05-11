import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api, { apiFetch } from '../api'
import type { Medewerker } from '@shared/types'

export const useMedewerkersStore = defineStore('medewerkers', () => {
  const medewerkers = ref<Medewerker[]>([])
  const loaded = ref(false)
  const loading = ref(false)

  async function fetchMedewerkers(force = false) {
    if (loaded.value && !force) return
    loading.value = true
    try {
      medewerkers.value = await apiFetch<Medewerker[]>('GET', '/medewerkers')
      loaded.value = true
    } finally {
      loading.value = false
    }
  }

  async function createMedewerker(data: Partial<Medewerker>) {
    const m = await apiFetch<Medewerker>('POST', '/medewerkers', data)
    medewerkers.value.push(m)
    return m
  }

  async function updateMedewerker(id: string, data: Partial<Medewerker>) {
    const m = await apiFetch<Medewerker>('PUT', `/medewerkers/${id}`, data)
    const idx = medewerkers.value.findIndex(x => x.id === id)
    if (idx >= 0) medewerkers.value[idx] = m
    return m
  }

  async function deleteMedewerker(id: string) {
    await apiFetch('DELETE', `/medewerkers/${id}`)
    medewerkers.value = medewerkers.value.filter(m => m.id !== id)
  }

  async function uploadAvatar(id: string, file: File) {
    const formData = new FormData()
    formData.append('file', file)
    const res = await api.post<{ ok: boolean; data: Medewerker }>(
      `/medewerkers/${id}/avatar`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    if (!res.data.ok) throw new Error('Upload mislukt')
    const idx = medewerkers.value.findIndex(m => m.id === id)
    if (idx >= 0) medewerkers.value[idx] = res.data.data
    return res.data.data
  }

  const byId = computed<Record<string, Medewerker>>(() =>
    Object.fromEntries(medewerkers.value.map(m => [m.id, m]))
  )

  function getMedewerker(id: string | null | undefined): Medewerker | null {
    if (!id) return null
    return byId.value[id] || null
  }

  return {
    medewerkers,
    loaded,
    loading,
    fetchMedewerkers,
    createMedewerker,
    updateMedewerker,
    deleteMedewerker,
    uploadAvatar,
    byId,
    getMedewerker,
  }
})
