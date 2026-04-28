import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiFetch } from '../api'
import api from '../api'
import type {
  Klant, KlantCommunicatie, KlantContactpersoon, KlantHuisstijlBestand,
  KlantDoelgroep, KlantDoel, KlantDoelFocuspunt,
} from '@shared/types'

export const useKlantenStore = defineStore('klanten', () => {
  // State
  const klanten = ref<Klant[]>([])
  const currentKlant = ref<Klant | null>(null)
  const communicatie = ref<KlantCommunicatie[]>([])
  const contactpersonen = ref<KlantContactpersoon[]>([])
  const huisstijl = ref<KlantHuisstijlBestand[]>([])
  const doelgroepen = ref<KlantDoelgroep[]>([])
  const doelen = ref<KlantDoel[]>([])
  const focuspunten = ref<KlantDoelFocuspunt[]>([])
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

  // ---- Contactpersonen ----
  async function fetchContactpersonen(klantId: string) {
    contactpersonen.value = await apiFetch<KlantContactpersoon[]>('GET', `/klanten/${klantId}/contactpersonen`)
  }

  async function createContactpersoon(klantId: string, data: Partial<KlantContactpersoon>) {
    const c = await apiFetch<KlantContactpersoon>('POST', `/klanten/${klantId}/contactpersonen`, data)
    contactpersonen.value.push(c)
    return c
  }

  async function updateContactpersoon(klantId: string, cpId: string, data: Partial<KlantContactpersoon>) {
    const c = await apiFetch<KlantContactpersoon>('PUT', `/klanten/${klantId}/contactpersonen/${cpId}`, data)
    const idx = contactpersonen.value.findIndex(x => x.id === cpId)
    if (idx >= 0) contactpersonen.value[idx] = c
    return c
  }

  async function deleteContactpersoon(klantId: string, cpId: string) {
    await apiFetch('DELETE', `/klanten/${klantId}/contactpersonen/${cpId}`)
    contactpersonen.value = contactpersonen.value.filter(c => c.id !== cpId)
  }

  // ---- Huisstijl ----
  async function fetchHuisstijl(klantId: string) {
    huisstijl.value = await apiFetch<KlantHuisstijlBestand[]>('GET', `/klanten/${klantId}/huisstijl`)
  }

  async function uploadHuisstijl(klantId: string, file: File, beschrijving: string = '') {
    const formData = new FormData()
    formData.append('file', file)
    if (beschrijving) formData.append('beschrijving', beschrijving)
    const res = await api.post<{ ok: boolean; data: KlantHuisstijlBestand }>(
      `/klanten/${klantId}/huisstijl`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    if (!res.data.ok) throw new Error('Upload mislukt')
    huisstijl.value.unshift(res.data.data)
    return res.data.data
  }

  async function updateHuisstijl(klantId: string, fileId: string, data: Partial<KlantHuisstijlBestand>) {
    const c = await apiFetch<KlantHuisstijlBestand>('PUT', `/klanten/${klantId}/huisstijl/${fileId}`, data)
    const idx = huisstijl.value.findIndex(x => x.id === fileId)
    if (idx >= 0) huisstijl.value[idx] = c
    return c
  }

  async function deleteHuisstijl(klantId: string, fileId: string) {
    await apiFetch('DELETE', `/klanten/${klantId}/huisstijl/${fileId}`)
    huisstijl.value = huisstijl.value.filter(h => h.id !== fileId)
  }

  // ---- Doelgroepen ----
  async function fetchKlantDoelgroepen(klantId: string) {
    doelgroepen.value = await apiFetch<KlantDoelgroep[]>('GET', `/klanten/${klantId}/doelgroepen`)
  }

  async function createKlantDoelgroep(klantId: string, data: Partial<KlantDoelgroep>) {
    const d = await apiFetch<KlantDoelgroep>('POST', `/klanten/${klantId}/doelgroepen`, data)
    doelgroepen.value.push(d)
    return d
  }

  async function updateKlantDoelgroep(klantId: string, dgId: string, data: Partial<KlantDoelgroep>) {
    const d = await apiFetch<KlantDoelgroep>('PUT', `/klanten/${klantId}/doelgroepen/${dgId}`, data)
    const idx = doelgroepen.value.findIndex(x => x.id === dgId)
    if (idx >= 0) doelgroepen.value[idx] = d
    return d
  }

  async function deleteKlantDoelgroep(klantId: string, dgId: string) {
    await apiFetch('DELETE', `/klanten/${klantId}/doelgroepen/${dgId}`)
    doelgroepen.value = doelgroepen.value.filter(d => d.id !== dgId)
  }

  // ---- Doelen ----
  async function fetchDoelen(klantId: string) {
    doelen.value = await apiFetch<KlantDoel[]>('GET', `/klanten/${klantId}/doelen`)
  }

  async function createDoel(klantId: string, data: Partial<KlantDoel>) {
    const d = await apiFetch<KlantDoel>('POST', `/klanten/${klantId}/doelen`, data)
    doelen.value.push(d)
    return d
  }

  async function updateDoel(klantId: string, doelId: string, data: Partial<KlantDoel>) {
    const d = await apiFetch<KlantDoel>('PUT', `/klanten/${klantId}/doelen/${doelId}`, data)
    const idx = doelen.value.findIndex(x => x.id === doelId)
    if (idx >= 0) doelen.value[idx] = d
    return d
  }

  async function deleteDoel(klantId: string, doelId: string) {
    await apiFetch('DELETE', `/klanten/${klantId}/doelen/${doelId}`)
    doelen.value = doelen.value.filter(d => d.id !== doelId)
    focuspunten.value = focuspunten.value.filter(f => f.doelId !== doelId)
  }

  // ---- Focuspunten ----
  async function fetchFocuspunten(klantId: string) {
    focuspunten.value = await apiFetch<KlantDoelFocuspunt[]>('GET', `/klanten/${klantId}/focuspunten`)
  }

  async function createFocuspunt(klantId: string, doelId: string, data: Partial<KlantDoelFocuspunt>) {
    const f = await apiFetch<KlantDoelFocuspunt>('POST', `/klanten/${klantId}/doelen/${doelId}/focuspunten`, data)
    focuspunten.value.push(f)
    return f
  }

  async function updateFocuspunt(klantId: string, fpId: string, data: Partial<KlantDoelFocuspunt>) {
    const f = await apiFetch<KlantDoelFocuspunt>('PUT', `/klanten/${klantId}/focuspunten/${fpId}`, data)
    const idx = focuspunten.value.findIndex(x => x.id === fpId)
    if (idx >= 0) focuspunten.value[idx] = f
    return f
  }

  async function deleteFocuspunt(klantId: string, fpId: string) {
    await apiFetch('DELETE', `/klanten/${klantId}/focuspunten/${fpId}`)
    focuspunten.value = focuspunten.value.filter(f => f.id !== fpId)
  }

  return {
    klanten, currentKlant, communicatie, contactpersonen, huisstijl,
    doelgroepen, doelen, focuspunten, loading,
    fetchKlanten, fetchKlant, createKlant, updateKlant, deleteKlant,
    fetchCommunicatie, createCommunicatie, updateCommunicatie, deleteCommunicatie,
    fetchContactpersonen, createContactpersoon, updateContactpersoon, deleteContactpersoon,
    fetchHuisstijl, uploadHuisstijl, updateHuisstijl, deleteHuisstijl,
    fetchKlantDoelgroepen, createKlantDoelgroep, updateKlantDoelgroep, deleteKlantDoelgroep,
    fetchDoelen, createDoel, updateDoel, deleteDoel,
    fetchFocuspunten, createFocuspunt, updateFocuspunt, deleteFocuspunt,
  }
})
