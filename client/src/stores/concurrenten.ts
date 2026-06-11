import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiFetch } from '../api'
import { useStructuurStore } from './structuurStore'
import { useProjectStore } from './projectStore'
import type {
  Concurrent, ConcurrentPagina, ConcurrentFunctie, Doorzet, ConcurrentenDoc,
  SiteNode, JourneyFase,
} from '@shared/types'

// Eén aggregaat-rij in de vergelijkingsmatrix (per uniek genormaliseerd label).
export interface AggregaatRij {
  label: string            // weergave-casing (eerste invoer wint)
  key: string              // genormaliseerd label, voor matching/doorzetten
  aanwezigBij: string[]    // concurrentId[] waar dit label voorkomt
  aantal: number           // aanwezigBij.length
  totaal: number           // totaal aantal concurrenten
  doorzet: Doorzet | null  // matchende doorzet op key, of null
}

export type SubView = 'invoer' | 'vergelijking'

function normLabel(naam: string): string {
  return (naam || '').trim().toLowerCase()
}

export function slugify(input: string): string {
  return (input || '')
    .toString()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')   // diacritieten weg
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export const useConcurrentenStore = defineStore('concurrenten', () => {
  // --- State ---
  const projectId = ref<string>('')
  const concurrenten = ref<Concurrent[]>([])
  const doorzetten = ref<Doorzet[]>([])
  const geselecteerdeConcurrentId = ref<string | null>(null)
  const actieveSubview = ref<SubView>('vergelijking')
  const drempel = ref(1) // toon labels die ≥ drempel keer voorkomen
  const loading = ref(false)
  const error = ref<string | null>(null)

  // --- Computed ---
  const geselecteerdeConcurrent = computed(
    () => concurrenten.value.find(c => c.id === geselecteerdeConcurrentId.value) ?? null,
  )

  const totaal = computed(() => concurrenten.value.length)

  // Alle unieke labels in dit project (voor autocomplete/datalist in de invoer).
  const bestaandePaginaLabels = computed(() =>
    [...new Set(concurrenten.value.flatMap(c => c.paginas.map(p => p.naam)))].sort(),
  )
  const bestaandeFunctieLabels = computed(() =>
    [...new Set(concurrenten.value.flatMap(c => c.functies.map(f => f.naam)))].sort(),
  )

  // Generieke aggregator: bouwt matrix-rijen op uit een lijst (concurrentId, naam).
  function buildAggregaat(
    items: Array<{ concurrentId: string; naam: string }>,
    type: 'pagina' | 'functie',
  ): AggregaatRij[] {
    const map = new Map<string, { label: string; bij: Set<string> }>()
    for (const { concurrentId, naam } of items) {
      const key = normLabel(naam)
      if (!key) continue
      if (!map.has(key)) map.set(key, { label: naam.trim(), bij: new Set() })
      map.get(key)!.bij.add(concurrentId)
    }
    const tot = totaal.value
    const rows: AggregaatRij[] = []
    for (const [key, { label, bij }] of map) {
      const doorzet = doorzetten.value.find(d => d.type === type && d.label === key) ?? null
      rows.push({ label, key, aanwezigBij: [...bij], aantal: bij.size, totaal: tot, doorzet })
    }
    rows.sort((a, b) => b.aantal - a.aantal || a.label.localeCompare(b.label, 'nl'))
    return rows
  }

  const paginaAggregaat = computed<AggregaatRij[]>(() =>
    buildAggregaat(
      concurrenten.value.flatMap(c => c.paginas.map(p => ({ concurrentId: c.id, naam: p.naam }))),
      'pagina',
    ).filter(r => r.aantal >= drempel.value),
  )

  const functieAggregaat = computed<AggregaatRij[]>(() =>
    buildAggregaat(
      concurrenten.value.flatMap(c => c.functies.map(f => ({ concurrentId: c.id, naam: f.naam }))),
      'functie',
    ).filter(r => r.aantal >= drempel.value),
  )

  // --- Helpers ---
  function setError(e: unknown) {
    error.value = e instanceof Error ? e.message : 'Er ging iets mis'
  }
  function base() {
    return `/projects/${projectId.value}/concurrenten`
  }

  // --- Load ---
  async function fetch(pid: string) {
    projectId.value = pid
    loading.value = true
    error.value = null
    try {
      const doc = await apiFetch<ConcurrentenDoc>('GET', base())
      concurrenten.value = doc.concurrenten || []
      doorzetten.value = doc.doorzetten || []
      // Standaard sub-view: vergelijking bij ≥2 concurrenten, anders invoer.
      actieveSubview.value = concurrenten.value.length >= 2 ? 'vergelijking' : 'invoer'
      if (!geselecteerdeConcurrentId.value && concurrenten.value.length > 0) {
        geselecteerdeConcurrentId.value = concurrenten.value[0].id
      }
    } catch (e) {
      setError(e)
    } finally {
      loading.value = false
    }
  }

  // --- Concurrenten ---
  async function addConcurrent(naam: string, url?: string, notitie?: string) {
    try {
      const c = await apiFetch<Concurrent>('POST', base(), { naam, url, notitie })
      concurrenten.value.push(c)
      geselecteerdeConcurrentId.value = c.id
      return c
    } catch (e) { setError(e); throw e }
  }

  async function updateConcurrent(id: string, patch: Partial<Pick<Concurrent, 'naam' | 'url' | 'notitie'>>) {
    try {
      const c = await apiFetch<Concurrent>('PATCH', `${base()}/${id}`, patch)
      const idx = concurrenten.value.findIndex(x => x.id === id)
      if (idx >= 0) concurrenten.value[idx] = c
      return c
    } catch (e) { setError(e); throw e }
  }

  async function deleteConcurrent(id: string) {
    try {
      await apiFetch('DELETE', `${base()}/${id}`)
      concurrenten.value = concurrenten.value.filter(c => c.id !== id)
      if (geselecteerdeConcurrentId.value === id) {
        geselecteerdeConcurrentId.value = concurrenten.value[0]?.id ?? null
      }
    } catch (e) { setError(e); throw e }
  }

  // --- Pagina's ---
  async function addPagina(concurrentId: string, naam: string, url?: string, notitie?: string) {
    try {
      const p = await apiFetch<ConcurrentPagina>('POST', `${base()}/${concurrentId}/paginas`, { naam, url, notitie })
      concurrenten.value.find(c => c.id === concurrentId)?.paginas.push(p)
      return p
    } catch (e) { setError(e); throw e }
  }
  async function updatePagina(concurrentId: string, paginaId: string, patch: Partial<ConcurrentPagina>) {
    try {
      const p = await apiFetch<ConcurrentPagina>('PATCH', `${base()}/${concurrentId}/paginas/${paginaId}`, patch)
      const c = concurrenten.value.find(x => x.id === concurrentId)
      const idx = c?.paginas.findIndex(x => x.id === paginaId) ?? -1
      if (c && idx >= 0) c.paginas[idx] = p
      return p
    } catch (e) { setError(e); throw e }
  }
  async function deletePagina(concurrentId: string, paginaId: string) {
    try {
      await apiFetch('DELETE', `${base()}/${concurrentId}/paginas/${paginaId}`)
      const c = concurrenten.value.find(x => x.id === concurrentId)
      if (c) c.paginas = c.paginas.filter(x => x.id !== paginaId)
    } catch (e) { setError(e); throw e }
  }
  async function bulkPaginas(concurrentId: string, namen: string[]) {
    try {
      const created = await apiFetch<ConcurrentPagina[]>('POST', `${base()}/${concurrentId}/paginas/bulk`, { namen })
      concurrenten.value.find(c => c.id === concurrentId)?.paginas.push(...created)
      return created
    } catch (e) { setError(e); throw e }
  }

  // --- Functies ---
  async function addFunctie(concurrentId: string, naam: string, notitie?: string) {
    try {
      const f = await apiFetch<ConcurrentFunctie>('POST', `${base()}/${concurrentId}/functies`, { naam, notitie })
      concurrenten.value.find(c => c.id === concurrentId)?.functies.push(f)
      return f
    } catch (e) { setError(e); throw e }
  }
  async function updateFunctie(concurrentId: string, functieId: string, patch: Partial<ConcurrentFunctie>) {
    try {
      const f = await apiFetch<ConcurrentFunctie>('PATCH', `${base()}/${concurrentId}/functies/${functieId}`, patch)
      const c = concurrenten.value.find(x => x.id === concurrentId)
      const idx = c?.functies.findIndex(x => x.id === functieId) ?? -1
      if (c && idx >= 0) c.functies[idx] = f
      return f
    } catch (e) { setError(e); throw e }
  }
  async function deleteFunctie(concurrentId: string, functieId: string) {
    try {
      await apiFetch('DELETE', `${base()}/${concurrentId}/functies/${functieId}`)
      const c = concurrenten.value.find(x => x.id === concurrentId)
      if (c) c.functies = c.functies.filter(x => x.id !== functieId)
    } catch (e) { setError(e); throw e }
  }
  async function bulkFuncties(concurrentId: string, namen: string[]) {
    try {
      const created = await apiFetch<ConcurrentFunctie[]>('POST', `${base()}/${concurrentId}/functies/bulk`, { namen })
      concurrenten.value.find(c => c.id === concurrentId)?.functies.push(...created)
      return created
    } catch (e) { setError(e); throw e }
  }

  // --- Doorzet-log ---
  async function addDoorzet(type: 'pagina' | 'functie', label: string, doel: 'structuur' | 'vraag', targetId: string) {
    const d = await apiFetch<Doorzet>('POST', `${base()}/doorzetten`, { type, label: normLabel(label), doel, targetId })
    doorzetten.value.push(d)
    return d
  }
  async function verwijderDoorzet(doorzetId: string) {
    try {
      await apiFetch('DELETE', `${base()}/doorzetten/${doorzetId}`)
      doorzetten.value = doorzetten.value.filter(d => d.id !== doorzetId)
    } catch (e) { setError(e); throw e }
  }

  // --- Doorzetten naar structuur (Fase 2) ---
  // Resultaat 'exists' = er bestaat al een node met dezelfde slug; de component
  // vraagt dan of er gekoppeld of een nieuwe gemaakt moet worden.
  async function doorzetNaarStructuur(
    rij: AggregaatRij,
  ): Promise<{ status: 'created' | 'exists'; node?: SiteNode; existingNode?: SiteNode }> {
    const structuur = useStructuurStore()
    await structuur.fetchNodes(projectId.value)
    const slug = slugify(rij.label)
    const existing = structuur.siteNodes.find(n => n.slug === slug)
    if (existing) return { status: 'exists', existingNode: existing }
    const node = await maakNieuweStructuurNode(rij)
    return { status: 'created', node }
  }

  // Maak een nieuwe top-level SiteNode (aanname) + doorzet-record.
  async function maakNieuweStructuurNode(rij: AggregaatRij): Promise<SiteNode> {
    try {
      const structuur = useStructuurStore()
      const node = await structuur.createNode(projectId.value, {
        title: rij.label,
        slug: slugify(rij.label),
        parentId: null,
        type: 'page',
        label: 'nieuw',
        bron: 'concurrentie-analyse',
        aanname: true,
      })
      await addDoorzet('pagina', rij.key, 'structuur', node.id)
      return node
    } catch (e) { setError(e); throw e }
  }

  // Koppel het label aan een bestaande node (geen nieuwe node).
  async function koppelAanBestaande(rij: AggregaatRij, nodeId: string) {
    try {
      await addDoorzet('pagina', rij.key, 'structuur', nodeId)
    } catch (e) { setError(e); throw e }
  }

  // --- Doorzetten naar vraag (Fase 1) ---
  async function doorzetNaarVraag(rij: AggregaatRij, doelgroepId: string, fase: JourneyFase, customText?: string) {
    try {
      const project = useProjectStore()
      const text = customText?.trim() || `${rij.label} — wil de klant dit ook? (gezien bij ${rij.aantal} van ${rij.totaal} concurrenten)`
      const vraag = await project.createDoelgroepVraag(projectId.value, doelgroepId, {
        fase,
        text,
        opmerkingen: 'Afkomstig uit concurrentie-analyse',
        bron: 'concurrentie-analyse',
        aanname: true,
      })
      await addDoorzet('functie', rij.key, 'vraag', vraag.id)
      return vraag
    } catch (e) { setError(e); throw e }
  }

  return {
    // State
    projectId, concurrenten, doorzetten, geselecteerdeConcurrentId,
    actieveSubview, drempel, loading, error,
    // Computed
    geselecteerdeConcurrent, totaal, bestaandePaginaLabels, bestaandeFunctieLabels,
    paginaAggregaat, functieAggregaat,
    // Actions
    fetch,
    addConcurrent, updateConcurrent, deleteConcurrent,
    addPagina, updatePagina, deletePagina, bulkPaginas,
    addFunctie, updateFunctie, deleteFunctie, bulkFuncties,
    addDoorzet, verwijderDoorzet,
    doorzetNaarStructuur, maakNieuweStructuurNode, koppelAanBestaande, doorzetNaarVraag,
  }
})
