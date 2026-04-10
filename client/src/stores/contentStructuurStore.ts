import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiFetch } from '../api'
import type { ContentStructuurRow, ContentStructuurPreset } from '@shared/types'

export const useContentStructuurStore = defineStore('contentStructuur', () => {
  const rows = ref<ContentStructuurRow[]>([])
  const presets = ref<ContentStructuurPreset[]>([])
  const loading = ref(false)

  // ---- Rows ----
  async function fetchRows(projectId: string) {
    loading.value = true
    try {
      rows.value = await apiFetch<ContentStructuurRow[]>('GET', `/content-structuur/${projectId}`)
    } finally { loading.value = false }
  }

  async function createRow(projectId: string, data: Partial<ContentStructuurRow>) {
    const r = await apiFetch<ContentStructuurRow>('POST', `/content-structuur/${projectId}`, data)
    rows.value.push(r)
    return r
  }

  async function updateRow(projectId: string, rowId: string, data: Partial<ContentStructuurRow>) {
    const r = await apiFetch<ContentStructuurRow>('PUT', `/content-structuur/${projectId}/${rowId}`, data)
    const idx = rows.value.findIndex(x => x.id === rowId)
    if (idx >= 0) rows.value[idx] = r
    return r
  }

  async function deleteRow(projectId: string, rowId: string) {
    await apiFetch<{ deleted: boolean }>('DELETE', `/content-structuur/${projectId}/${rowId}`)
    rows.value = rows.value.filter(x => x.id !== rowId)
  }

  async function bulkImport(projectId: string, incoming: Partial<ContentStructuurRow>[], replace: boolean = false) {
    const created = await apiFetch<ContentStructuurRow[]>('POST', `/content-structuur/${projectId}/bulk`, { rows: incoming, replace })
    if (replace) {
      rows.value = created
    } else {
      rows.value.push(...created)
    }
    return created
  }

  async function syncFromStructuur(projectId: string) {
    loading.value = true
    try {
      const result = await apiFetch<{ created: number; updated: number; rows: ContentStructuurRow[] }>('POST', `/content-structuur/${projectId}/sync-from-structuur`)
      rows.value = result.rows
      return result
    } finally {
      loading.value = false
    }
  }

  // ---- Presets ----
  async function fetchPresets(projectId: string) {
    presets.value = await apiFetch<ContentStructuurPreset[]>('GET', `/content-structuur/${projectId}/presets`)
  }

  async function createPreset(projectId: string, data: Partial<ContentStructuurPreset>) {
    const p = await apiFetch<ContentStructuurPreset>('POST', `/content-structuur/${projectId}/presets`, data)
    presets.value.push(p)
    return p
  }

  async function updatePreset(projectId: string, presetId: string, data: Partial<ContentStructuurPreset>) {
    const p = await apiFetch<ContentStructuurPreset>('PUT', `/content-structuur/${projectId}/presets/${presetId}`, data)
    const idx = presets.value.findIndex(x => x.id === presetId)
    if (idx >= 0) presets.value[idx] = p
    return p
  }

  async function deletePreset(projectId: string, presetId: string) {
    await apiFetch<{ deleted: boolean }>('DELETE', `/content-structuur/${projectId}/presets/${presetId}`)
    presets.value = presets.value.filter(x => x.id !== presetId)
  }

  return {
    rows, presets, loading,
    fetchRows, createRow, updateRow, deleteRow, bulkImport, syncFromStructuur,
    fetchPresets, createPreset, updatePreset, deletePreset,
  }
})
