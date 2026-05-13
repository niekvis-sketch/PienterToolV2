<template>
  <DetailLayout>
    <!-- Header: titel + acties -->
    <div class="flex items-end justify-between mb-6">
      <div>
        <p class="eyebrow">Overzicht</p>
        <h1 class="text-3xl font-bold tracking-tight text-pienter-700 mt-1 flex items-baseline gap-2">
          Archive<span class="accent-dot"></span>
        </h1>
        <p class="text-ink-3 text-sm mt-2">Beheer alle Pienter-medewerkers</p>
      </div>
      <button class="btn btn-primary" @click="openCreate">Nieuwe medewerker</button>
    </div>

    <!-- Filter-balk -->
    <div class="flex items-center gap-3 mb-4">
      <input
        v-model="search"
        type="text"
        placeholder="Zoek op naam of email..."
        class="input flex-1"
      />
      <select v-model="teamFilter" class="select max-w-[180px]">
        <option value="">Alle teams</option>
        <option v-for="t in teams" :key="t" :value="t">{{ teamLabel(t) }}</option>
      </select>
      <div class="flex gap-1">
        <button
          type="button"
          class="view-toggle"
          :class="{ 'is-active': view === 'grid' }"
          @click="view = 'grid'"
          title="Grid-weergave"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
        </button>
        <button
          type="button"
          class="view-toggle"
          :class="{ 'is-active': view === 'list' }"
          @click="view = 'list'"
          title="Lijst-weergave"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="store.loading" class="text-center py-16 text-ink-mute">Laden...</div>

    <!-- Lege staat -->
    <div v-else-if="filtered.length === 0 && store.medewerkers.length === 0" class="empty-state">
      <div class="text-4xl mb-4">👥</div>
      <h2 class="text-lg font-semibold text-ink-2">Nog geen medewerkers</h2>
      <p>Voeg een medewerker toe om te beginnen.</p>
      <div class="mt-6 flex justify-center">
        <button class="btn btn-primary" @click="openCreate">Nieuwe medewerker</button>
      </div>
    </div>

    <!-- Geen resultaten -->
    <div v-else-if="filtered.length === 0" class="text-center py-12 text-ink-3">
      Geen medewerkers gevonden met deze filters.
    </div>

    <!-- Grid (Pienter Archive look) -->
    <div v-else-if="view === 'grid'" class="archive-grid">
      <button
        v-for="m in filtered"
        :key="m.id"
        type="button"
        class="archive-card"
        @click="openEdit(m)"
      >
        <!-- Foto / avatar (pink) -->
        <div class="archive-avatar">
          <img
            v-if="m.avatarPath"
            :src="`/api/uploads/${m.avatarPath}`"
            :alt="m.naam"
          />
          <span v-else>{{ initials(m.naam) }}</span>
        </div>

        <!-- Naam + functie -->
        <div class="min-w-0 relative z-10">
          <div class="font-semibold text-ink truncate">{{ m.naam || '—' }}</div>
          <div class="text-xs text-ink-3 truncate">{{ m.functie || '—' }}</div>
        </div>

        <!-- Team-tag (amber highlight) -->
        <span class="badge badge-highlight self-start shrink-0 relative z-10">
          {{ teamLabel(m.team) }}
        </span>

        <!-- Decoratieve roze blob -->
        <svg class="archive-blob" viewBox="0 0 120 64" preserveAspectRatio="none">
          <path d="M-10 64 C 20 30, 40 50, 60 36 C 80 22, 100 44, 130 30 L 130 64 Z" fill="var(--accent)" opacity=".55" />
          <path d="M20 64 C 50 44, 60 56, 90 44 C 110 36, 120 50, 140 44 L 140 64 Z" fill="var(--accent)" opacity=".85" />
        </svg>
      </button>
    </div>

    <!-- Tabel -->
    <div v-else class="card overflow-hidden">
      <table class="w-full text-sm">
        <thead>
          <tr>
            <th class="text-left px-4 py-3 w-12"></th>
            <th class="text-left px-4 py-3">Naam</th>
            <th class="text-left px-4 py-3">Functie</th>
            <th class="text-left px-4 py-3">Team</th>
            <th class="text-left px-4 py-3">Email</th>
            <th class="text-right px-4 py-3">Acties</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="m in filtered"
            :key="m.id"
            class="cursor-pointer"
            @click="openEdit(m)"
          >
            <td class="px-4 py-3">
              <MedewerkerAvatar :medewerker="m" size="md" />
            </td>
            <td class="px-4 py-3 font-medium text-ink">{{ m.naam || '—' }}</td>
            <td class="px-4 py-3 text-ink-2">{{ m.functie || '—' }}</td>
            <td class="px-4 py-3">
              <span class="badge badge-highlight">{{ teamLabel(m.team) }}</span>
            </td>
            <td class="px-4 py-3 text-ink-2">{{ m.email || '—' }}</td>
            <td class="px-4 py-3 text-right">
              <button
                class="text-xs hover:underline"
                style="color: var(--danger);"
                @click.stop="onDelete(m)"
              >Verwijderen</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal: aanmaken / bewerken -->
    <div
      v-if="showModal"
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      @click.self="closeModal"
    >
      <div class="bg-white rounded-veld border border-cream-400 shadow-veld-3 w-full max-w-md p-6">
        <h2 class="text-lg font-semibold text-ink mb-4 flex items-baseline gap-2">
          {{ editingId ? 'Medewerker bewerken' : 'Nieuwe medewerker' }}
          <span class="accent-dot"></span>
        </h2>

        <!-- Avatar preview + upload -->
        <div v-if="editingId" class="flex items-center gap-4 mb-5">
          <MedewerkerAvatar :medewerkerId="editingId" size="lg" />
          <div>
            <label class="btn btn-secondary btn-sm cursor-pointer">
              {{ uploading ? 'Uploaden...' : 'Avatar uploaden' }}
              <input
                type="file"
                accept="image/*"
                class="hidden"
                :disabled="uploading"
                @change="onAvatarChange"
              />
            </label>
            <p class="text-[11px] text-ink-mute mt-1">Max 5MB · jpg/png</p>
          </div>
        </div>

        <div class="space-y-3">
          <div>
            <label class="block text-xs font-medium text-ink-2 mb-1">Naam</label>
            <input v-model="form.naam" type="text" class="input" placeholder="Voor- en achternaam" />
          </div>
          <div>
            <label class="block text-xs font-medium text-ink-2 mb-1">Email</label>
            <input v-model="form.email" type="email" class="input" placeholder="naam@pienter.nl" />
          </div>
          <div>
            <label class="block text-xs font-medium text-ink-2 mb-1">Functie</label>
            <input v-model="form.functie" type="text" class="input" placeholder="SEO specialist, Account manager, ..." />
          </div>
          <div>
            <label class="block text-xs font-medium text-ink-2 mb-1">Team</label>
            <select v-model="form.team" class="select">
              <option v-for="t in teams" :key="t" :value="t">{{ teamLabel(t) }}</option>
            </select>
          </div>
        </div>

        <div class="flex justify-end gap-2 mt-6">
          <button class="btn btn-secondary" :disabled="saving" @click="closeModal">Annuleren</button>
          <button class="btn btn-primary" :disabled="saving" @click="onSave">
            {{ saving ? 'Opslaan...' : 'Opslaan' }}
          </button>
        </div>
      </div>
    </div>
  </DetailLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, reactive } from 'vue'
import { useMedewerkersStore } from '../stores/medewerkersStore'
import DetailLayout from '../components/DetailLayout.vue'
import MedewerkerAvatar from '../components/medewerkers/MedewerkerAvatar.vue'
import type { Medewerker, Team } from '@shared/types'

const store = useMedewerkersStore()

const search = ref('')
const teamFilter = ref<Team | ''>('')
const view = ref<'grid' | 'list'>('grid')

const showModal = ref(false)
const editingId = ref<string | null>(null)
const saving = ref(false)
const uploading = ref(false)

const form = reactive<{
  naam: string
  email: string
  functie: string
  team: Team
}>({
  naam: '',
  email: '',
  functie: '',
  team: 'overig',
})

const teams: Team[] = ['seo', 'content', 'advertising', 'website', 'overig']

const teamLabels: Record<Team, string> = {
  seo: 'Team SEO',
  content: 'Team content',
  advertising: 'Team advertising',
  website: 'Team website',
  overig: 'Overig',
}

function teamLabel(t: Team): string {
  return teamLabels[t] ?? t
}

function initials(naam: string): string {
  const n = (naam || '').trim()
  if (!n) return '?'
  const parts = n.split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return store.medewerkers.filter(m => {
    if (teamFilter.value && m.team !== teamFilter.value) return false
    if (!q) return true
    return (
      m.naam.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m.functie.toLowerCase().includes(q)
    )
  })
})

onMounted(() => {
  store.fetchMedewerkers()
})

function resetForm() {
  form.naam = ''
  form.email = ''
  form.functie = ''
  form.team = 'overig'
}

function openCreate() {
  editingId.value = null
  resetForm()
  showModal.value = true
}

function openEdit(m: Medewerker) {
  editingId.value = m.id
  form.naam = m.naam
  form.email = m.email
  form.functie = m.functie
  form.team = m.team
  showModal.value = true
}

function closeModal() {
  if (saving.value || uploading.value) return
  showModal.value = false
  editingId.value = null
}

async function onSave() {
  saving.value = true
  try {
    if (editingId.value) {
      await store.updateMedewerker(editingId.value, { ...form })
    } else {
      const m = await store.createMedewerker({ ...form })
      editingId.value = m.id
    }
  } catch (e) {
    console.error(e)
    alert('Opslaan mislukt')
  } finally {
    saving.value = false
  }
}

async function onAvatarChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file || !editingId.value) return
  uploading.value = true
  try {
    await store.uploadAvatar(editingId.value, file)
  } catch (err) {
    console.error(err)
    alert('Upload mislukt')
  } finally {
    uploading.value = false
    input.value = ''
  }
}

async function onDelete(m: Medewerker) {
  if (!confirm(`Medewerker "${m.naam || 'zonder naam'}" verwijderen?`)) return
  try {
    await store.deleteMedewerker(m.id)
  } catch (e) {
    console.error(e)
    alert('Verwijderen mislukt')
  }
}
</script>

<style scoped>
/* Archive grid (Pienter Archive artboard) */
.archive-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 12px;
}

.archive-card {
  position: relative;
  display: grid;
  grid-template-columns: 64px 1fr auto;
  gap: 14px;
  align-items: center;
  padding: 12px;
  text-align: left;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--r-3);
  overflow: hidden;
  box-shadow: var(--shadow-1, 0 1px 0 rgba(20,36,27,0.04));
  cursor: pointer;
  transition: box-shadow .15s, transform .12s, border-color .15s;
}
.archive-card:hover {
  border-color: color-mix(in srgb, var(--primary) 25%, var(--line));
  box-shadow: var(--shadow-2, 0 6px 16px -6px rgba(20,36,27,0.10));
  transform: translateY(-1px);
}

.archive-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--accent);
  color: var(--on-accent);
  font-weight: 600;
  font-size: 18px;
  letter-spacing: -0.02em;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
  z-index: 1;
  flex-shrink: 0;
}
.archive-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.archive-blob {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 55%;
  height: 100%;
  pointer-events: none;
}

.view-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--r-2);
  border: 1px solid var(--line-strong);
  background: var(--surface);
  color: var(--ink-2);
  cursor: pointer;
  transition: background .12s, color .15s, border-color .12s;
}
.view-toggle:hover { background: var(--surface-2); color: var(--ink); }
.view-toggle.is-active {
  background: var(--primary-soft);
  color: var(--primary);
  border-color: color-mix(in srgb, var(--primary) 40%, transparent);
}

/* Tabel */
table th {
  font-weight: 500;
  color: var(--ink-3);
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  border-bottom: 1px solid var(--line);
  background: var(--bg-elev);
}
table td {
  border-top: 1px solid var(--line);
  vertical-align: middle;
}
tbody tr { transition: background .12s; }
tbody tr:hover { background: var(--bg-elev); }
</style>
