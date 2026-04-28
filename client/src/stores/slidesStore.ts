import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiFetch } from '../api'
import api from '../api'
import type {
  SlidePresentation,
  Slide,
  SlideContent,
  SlidePreset,
  SlideLayoutType,
} from '@shared/types'

export interface SlidePresentationSummary {
  id: string
  name: string
  slideCount: number
  createdAt: string
  updatedAt: string
}

export const useSlidesStore = defineStore('slides', () => {
  const presentations = ref<SlidePresentationSummary[]>([])
  const current = ref<SlidePresentation | null>(null)
  const presets = ref<SlidePreset[]>([])
  const loading = ref(false)
  const saving = ref(false)

  async function fetchPresentations() {
    loading.value = true
    try {
      presentations.value = await apiFetch<SlidePresentationSummary[]>('GET', '/slides/presentations')
    } finally {
      loading.value = false
    }
  }

  async function fetchPresentation(id: string) {
    loading.value = true
    try {
      current.value = await apiFetch<SlidePresentation>('GET', `/slides/presentations/${id}`)
    } finally {
      loading.value = false
    }
  }

  async function createPresentation(name: string): Promise<SlidePresentation> {
    const p = await apiFetch<SlidePresentation>('POST', '/slides/presentations', { name })
    await fetchPresentations()
    return p
  }

  async function deletePresentation(id: string) {
    await apiFetch<{ deleted: boolean }>('DELETE', `/slides/presentations/${id}`)
    presentations.value = presentations.value.filter(p => p.id !== id)
    if (current.value?.id === id) current.value = null
  }

  async function persistCurrent() {
    if (!current.value) return
    saving.value = true
    try {
      const updated = await apiFetch<SlidePresentation>(
        'PUT',
        `/slides/presentations/${current.value.id}`,
        { name: current.value.name, slides: current.value.slides },
      )
      current.value = updated
    } finally {
      saving.value = false
    }
  }

  // Debounced auto-save (2s)
  let saveTimer: ReturnType<typeof setTimeout> | null = null
  function scheduleSave() {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => { void persistCurrent() }, 2000)
  }

  async function addSlide(layout: SlideLayoutType, presetContent?: SlideContent) {
    if (!current.value) return
    const updated = await apiFetch<SlidePresentation>(
      'POST',
      `/slides/presentations/${current.value.id}/slides`,
      { layout, content: presetContent },
    )
    current.value = updated
  }

  function deleteSlide(slideId: string) {
    if (!current.value) return
    current.value.slides = current.value.slides
      .filter(s => s.id !== slideId)
      .map((s, i) => ({ ...s, order: i }))
    scheduleSave()
  }

  function reorderSlides(fromIndex: number, toIndex: number) {
    if (!current.value) return
    const slides = [...current.value.slides].sort((a, b) => a.order - b.order)
    const [moved] = slides.splice(fromIndex, 1)
    slides.splice(toIndex, 0, moved)
    current.value.slides = slides.map((s, i) => ({ ...s, order: i }))
    scheduleSave()
  }

  function updateSlide(slideId: string, patch: Partial<Slide>) {
    if (!current.value) return
    const idx = current.value.slides.findIndex(s => s.id === slideId)
    if (idx < 0) return
    current.value.slides[idx] = { ...current.value.slides[idx], ...patch }
    scheduleSave()
  }

  async function uploadImage(file: File): Promise<string> {
    const fd = new FormData()
    fd.append('image', file)
    const res = await api.post('/slides/uploads/image', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    if (!res.data.ok) throw new Error(res.data.error ?? 'Upload mislukt')
    return (res.data.data as { src: string }).src
  }

  async function fetchPresets() {
    presets.value = await apiFetch<SlidePreset[]>('GET', '/slides/presets')
  }

  async function savePreset(name: string, slide: Slide): Promise<SlidePreset> {
    const preset = await apiFetch<SlidePreset>('POST', '/slides/presets', {
      name,
      layout: slide.layout,
      content: slide.content,
    })
    presets.value.push(preset)
    return preset
  }

  async function deletePreset(id: string) {
    await apiFetch<{ deleted: boolean }>('DELETE', `/slides/presets/${id}`)
    presets.value = presets.value.filter(p => p.id !== id)
  }

  async function exportPptx(): Promise<void> {
    if (!current.value) return
    // Zorg dat de laatste wijzigingen op de server staan voor we exporteren
    if (saveTimer) { clearTimeout(saveTimer); saveTimer = null }
    await persistCurrent()

    const res = await api.post(
      `/slides/presentations/${current.value.id}/export-pptx`,
      {},
      { responseType: 'blob' },
    )
    const blob = new Blob([res.data], {
      type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${current.value.name || 'presentatie'}.pptx`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return {
    presentations, current, presets, loading, saving,
    fetchPresentations, fetchPresentation, createPresentation, deletePresentation,
    persistCurrent, scheduleSave,
    addSlide, deleteSlide, reorderSlides, updateSlide,
    uploadImage,
    fetchPresets, savePreset, deletePreset,
    exportPptx,
  }
})
