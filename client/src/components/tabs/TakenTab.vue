<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-xl font-bold text-gray-900 mb-1">Taken</h2>
        <p class="text-sm text-gray-500">Beheer taken per team en fase, met afhankelijkheden</p>
      </div>
      <button class="btn-primary btn-sm" @click="showNewTask = true">Nieuwe taak</button>
    </div>

    <!-- Filters -->
    <div class="flex gap-3 mb-4 flex-wrap">
      <select v-model="filterTeam" class="select w-auto">
        <option value="">Alle teams</option>
        <option v-for="t in teams" :key="t" :value="t">{{ t }}</option>
      </select>
      <select v-model="filterStatus" class="select w-auto">
        <option value="">Alle statussen</option>
        <option value="todo">Te doen</option>
        <option value="doing">Bezig</option>
        <option value="blocked">Geblokkeerd</option>
        <option value="done">Klaar</option>
      </select>
      <select v-model="filterPhase" class="select w-auto">
        <option value="">Alle fasen</option>
        <option v-for="p in phaseOptions" :key="p" :value="p">{{ p }}</option>
      </select>
    </div>

    <!-- Lege staat -->
    <div v-if="store.tasks.length === 0" class="empty-state card p-12">
      <div class="text-4xl mb-4">✅</div>
      <h3 class="text-lg font-semibold text-gray-700">Nog geen taken</h3>
      <p>Importeer eerst een structuur om automatisch taken te genereren, of maak handmatig taken aan.</p>
    </div>

    <!-- Taken lijst -->
    <div v-else class="space-y-2">
      <div
        v-for="task in filteredTasks"
        :key="task.id"
        class="card p-4 hover:border-pienter-200 transition-colors"
      >
        <div class="flex items-start justify-between">
          <div class="flex items-start gap-3 flex-1">
            <!-- Status toggle -->
            <button
              class="mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors"
              :class="task.status === 'done' ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-pienter-400'"
              @click="toggleDone(task)"
            >
              <span v-if="task.status === 'done'" class="text-xs">✓</span>
            </button>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="font-medium text-gray-900" :class="{ 'line-through text-gray-400': task.status === 'done' }">{{ task.title }}</span>
                <span :class="'badge badge-' + task.status" class="text-[10px]">{{ statusLabel(task.status) }}</span>
                <span v-if="isBlocked(task)" class="text-xs text-red-500 flex items-center gap-0.5">🔒 Geblokkeerd door: {{ blockedBy(task) }}</span>
              </div>
              <p v-if="task.description" class="text-xs text-gray-500 mt-1">{{ task.description }}</p>
              <div class="flex gap-2 mt-2 flex-wrap">
                <span v-if="task.relatedPageId" class="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded">📄 {{ pageName(task.relatedPageId) }}</span>
                <span v-if="task.dueDate" class="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded">📅 {{ formatDate(task.dueDate) }}</span>
                <span class="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{{ task.phase }}</span>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2 shrink-0 ml-3">
            <span class="badge text-[10px]" :class="teamColor(task.team)">{{ task.team }}</span>
            <select
              :value="task.status"
              class="select w-auto text-xs py-1 px-2"
              @change="updateStatus(task, ($event.target as HTMLSelectElement).value)"
            >
              <option value="todo">Te doen</option>
              <option value="doing">Bezig</option>
              <option value="blocked">Geblokkeerd</option>
              <option value="done">Klaar</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Nieuwe taak modal -->
    <div v-if="showNewTask" class="fixed inset-0 bg-black/30 flex items-center justify-center z-50" @click.self="showNewTask = false">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
        <h3 class="text-lg font-bold mb-4">Nieuwe taak</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Titel</label>
            <input v-model="newTask.title" class="input" placeholder="Wat moet er gebeuren?" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Beschrijving</label>
            <textarea v-model="newTask.description" class="textarea" rows="2" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Team</label>
              <select v-model="newTask.team" class="select">
                <option v-for="t in teams" :key="t" :value="t">{{ t }}</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Fase</label>
              <select v-model="newTask.phase" class="select">
                <option v-for="p in phaseOptions" :key="p" :value="p">{{ p }}</option>
              </select>
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Gerelateerde pagina (optioneel)</label>
            <select v-model="newTask.relatedPageId" class="select">
              <option value="">Geen</option>
              <option v-for="p in store.pages" :key="p.id" :value="p.id">{{ p.title }}</option>
            </select>
          </div>
        </div>
        <div class="flex gap-3 mt-6">
          <button class="btn-primary" @click="createTask" :disabled="!newTask.title">Aanmaken</button>
          <button class="btn-secondary" @click="showNewTask = false">Annuleren</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useProjectStore } from '../../stores/projectStore'
import type { Task, TaskStatus, TeamType } from '@shared/types'

const store = useProjectStore()
const filterTeam = ref('')
const filterStatus = ref('')
const filterPhase = ref('')
const showNewTask = ref(false)

const teams: TeamType[] = ['UX', 'Content', 'SEO', 'Dev', 'PM']
const phaseOptions = ['strategie', 'inventarisatie', 'structuur', 'content', 'design', 'development', 'staging', 'pre-live', 'live', 'nazorg']

const newTask = reactive({
  title: '',
  description: '',
  team: 'PM' as TeamType,
  phase: 'strategie',
  relatedPageId: '',
})

const filteredTasks = computed(() => {
  return store.tasks.filter(t => {
    if (filterTeam.value && t.team !== filterTeam.value) return false
    if (filterStatus.value && t.status !== filterStatus.value) return false
    if (filterPhase.value && t.phase !== filterPhase.value) return false
    return true
  })
})

function isBlocked(task: Task): boolean {
  if (task.status === 'done') return false
  return task.dependsOnTaskIds.some(depId => {
    const dep = store.tasks.find(t => t.id === depId)
    return dep && dep.status !== 'done'
  })
}

function blockedBy(task: Task): string {
  return task.dependsOnTaskIds
    .map(depId => store.tasks.find(t => t.id === depId))
    .filter(dep => dep && dep.status !== 'done')
    .map(dep => dep!.title)
    .join(', ')
}

function pageName(pageId: string): string {
  return store.pages.find(p => p.id === pageId)?.title || 'Onbekend'
}

function statusLabel(s: TaskStatus): string {
  const labels: Record<TaskStatus, string> = { todo: 'Te doen', doing: 'Bezig', blocked: 'Geblokkeerd', done: 'Klaar' }
  return labels[s] || s
}

function teamColor(team: TeamType): string {
  const colors: Record<TeamType, string> = {
    UX: 'bg-purple-100 text-purple-700', Content: 'bg-yellow-100 text-yellow-700',
    SEO: 'bg-green-100 text-green-700', Dev: 'bg-blue-100 text-blue-700', PM: 'bg-gray-100 text-gray-700',
  }
  return colors[team] || 'bg-gray-100 text-gray-700'
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
}

async function toggleDone(task: Task) {
  const newStatus = task.status === 'done' ? 'todo' : 'done'
  await store.updateTask(store.currentProject!.id, task.id, { status: newStatus })
}

async function updateStatus(task: Task, status: string) {
  await store.updateTask(store.currentProject!.id, task.id, { status: status as TaskStatus })
}

async function createTask() {
  if (!newTask.title || !store.currentProject) return
  await store.createTask(store.currentProject.id, {
    ...newTask,
    relatedPageId: newTask.relatedPageId || null,
  } as Partial<Task>)
  newTask.title = ''
  newTask.description = ''
  showNewTask.value = false
}
</script>
