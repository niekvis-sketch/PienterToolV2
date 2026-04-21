import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiFetch } from '../api'
import type { Klant, KlantCommunicatie } from '@shared/types'

export const useKlantenStore = defineStore('klanten', () => {
  // State
  const klanten = ref<Klant[]>([])
  const currentKlant = ref<Klant | null>(null)
  const communicatie = ref<KlantCommunicatie[]>([])
  const loading = ref(false)

  // ---- Klanten ----
  async function fetchKlanten() {
    loading.value = true
    try {
      klanten.value = await apiFetch<Klant[]>('GET', '/klanten')
    } finally { loading.value = false }
  }

  async function fetchKlant(id: string) {
    loading.value = true
    try {
      currentKlant.value = await apiFetch<Klant>('GET', `/klanten/${id}`)
    } finally { loading.value = false }
  }

  async function createKlant(data: Partial<Klant>) {
    const k = await apiFetch<Klant>('POST', '/klanten', data)
    klanten.value.push(k)
    return k
  }

  async function updateKlant(id: string, data: Partial<Klant>) {
    const k = await apiFetch<Klant>('PUT', `/klanten/${id}`, data)
    currentKlant.value = k
    const idx = klanten.value.findIndex(x => x.id === id)
    if (idx >= 0) klanten.value[idx] = k
    return k
  }

  async function deleteKlant(id: string) {
    await apiFetch('DELETE', `/klanten/${id}`)
    klanten.value = klanten.value.filter(k => k.id !== id)
    if (currentKlant.value?.id === id) currentKlant.value = null
  }

  // ---- Communicatie ----
  async function fetchCommunicatie(klantId: string) {
    communicatie.value = await apiFetch<KlantCommunicatie[]>('GET', `/klanten/${klantId}/communicatie`)
  }

  async function createCommunicatie(klantId: string, data: Partial<KlantCommunicatie>) {
    const c = await apiFetch<KlantCommunicatie>('POST', `/klanten/${klantId}/communicatie`, data)
    communicatie.value.unshift(c)
    return c
  }

  async function updateCommunicatie(klantId: string, commId: string, data: Partial<KlantCommunicatie>) {
    const c = await apiFetch<KlantCommunicatie>('PUT', `/klanten/${klantId}/communicatie/${commId}`, data)
    const idx = communicatie.value.findIndex(x => x.id === commId)
    if (idx >= 0) communicatie.value[idx] = c
    return c
  }

  async function deleteCommunicatie(klantId: string, commId: string) {
    await apiFetch('DELETE', `/klanten/${klantId}/communicatie/${commId}`)
    communicatie.value = communicatie.value.filter(c => c.id !== commId)
  }

  return {
    klanten, currentKlant, communicatie, loading,
    fetchKlanten, fetchKlant, createKlant, updateKlant, deleteKlant,
    fetchCommunicatie, createCommunicatie, updateCommunicatie, deleteCommunicatie,
  }
})
