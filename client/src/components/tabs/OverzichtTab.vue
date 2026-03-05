<template>
  <div>
    <h2 class="text-xl font-bold text-gray-900 mb-1">Projectoverzicht</h2>
    <p class="text-sm text-gray-500 mb-6">Tijdlijn, voortgang en status per fase</p>

    <!-- Project info cards -->
    <div class="grid grid-cols-4 gap-4 mb-8">
      <div class="card p-4">
        <div class="text-xs text-gray-500 mb-1">Domein (nieuw)</div>
        <div class="font-semibold text-sm">{{ project?.domainNew || 'Nog niet ingesteld' }}</div>
      </div>
      <div class="card p-4">
        <div class="text-xs text-gray-500 mb-1">Go-live datum</div>
        <div class="font-semibold text-sm">{{ project?.goLiveDate ? formatDate(project.goLiveDate) : 'Niet gepland' }}</div>
      </div>
      <div class="card p-4">
        <div class="text-xs text-gray-500 mb-1">Pagina's</div>
        <div class="font-semibold text-sm">{{ store.pages.length }}</div>
      </div>
      <div class="card p-4">
        <div class="text-xs text-gray-500 mb-1">Open taken</div>
        <div class="font-semibold text-sm">{{ openTasks }} / {{ store.tasks.length }}</div>
      </div>
    </div>

    <!-- Fases tijdlijn -->
    <h3 class="text-lg font-semibold text-gray-900 mb-4">Procesfasen</h3>
    <div class="space-y-3">
      <div v-for="phase in phases" :key="phase.key" class="card p-4">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <span class="text-lg">{{ phase.icon }}</span>
            <h4 class="font-medium text-gray-900">{{ phase.label }}</h4>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs text-gray-500">{{ phaseDoneCount(phase.key) }}/{{ phaseTaskCount(phase.key) }} taken</span>
            <div class="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                class="h-full rounded-full transition-all"
                :class="phaseProgress(phase.key) === 100 ? 'bg-green-500' : 'bg-pienter-500'"
                :style="{ width: phaseProgress(phase.key) + '%' }"
              />
            </div>
          </div>
        </div>

        <!-- Taken in deze fase -->
        <div v-if="phaseTasks(phase.key).length > 0" class="mt-2 space-y-1">
          <div
            v-for="task in phaseTasks(phase.key)"
            :key="task.id"
            class="flex items-center justify-between py-1.5 px-2 rounded text-sm hover:bg-gray-50"
          >
            <div class="flex items-center gap-2">
              <span :class="'badge badge-' + task.status" class="text-[10px] min-w-[50px] text-center">{{ statusLabel(task.status) }}</span>
              <span class="text-gray-700">{{ task.title }}</span>
              <span v-if="task.relatedPageId" class="text-xs text-gray-400">📄</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="badge text-[10px]" :class="teamColor(task.team)">{{ task.team }}</span>
              <span v-if="isBlocked(task)" class="text-xs text-red-500">🔒 Geblokkeerd</span>
            </div>
          </div>
        </div>
        <div v-else class="text-xs text-gray-400 mt-1">Nog geen taken in deze fase.</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useProjectStore } from '../../stores/projectStore'
import type { TaskStatus, TeamType, ProjectPhase } from '@shared/types'

const store = useProjectStore()
const project = computed(() => store.currentProject)

const phases: { key: ProjectPhase; label: string; icon: string }[] = [
  { key: 'strategie', label: 'Strategie', icon: '🎯' },
  { key: 'inventarisatie', label: 'Inventarisatie', icon: '📋' },
  { key: 'structuur', label: 'Structuur', icon: '🏗️' },
  { key: 'content', label: 'Content', icon: '✍️' },
  { key: 'design', label: 'Design', icon: '🎨' },
  { key: 'development', label: 'Development', icon: '💻' },
  { key: 'staging', label: 'Staging', icon: '🚧' },
  { key: 'pre-live', label: 'Pre-live', icon: '🔍' },
  { key: 'live', label: 'Live', icon: '🚀' },
  { key: 'nazorg', label: 'Nazorg', icon: '🔄' },
]

const openTasks = computed(() => store.tasks.filter(t => t.status !== 'done').length)

function phaseTasks(phase: ProjectPhase) {
  return store.tasks.filter(t => t.phase === phase)
}

function phaseTaskCount(phase: ProjectPhase) { return phaseTasks(phase).length }
function phaseDoneCount(phase: ProjectPhase) { return phaseTasks(phase).filter(t => t.status === 'done').length }

function phaseProgress(phase: ProjectPhase) {
  const total = phaseTaskCount(phase)
  if (total === 0) return 0
  return Math.round((phaseDoneCount(phase) / total) * 100)
}

function isBlocked(task: { dependsOnTaskIds: string[]; status: string }) {
  if (task.status === 'done') return false
  if (task.dependsOnTaskIds.length === 0) return false
  return task.dependsOnTaskIds.some(depId => {
    const dep = store.tasks.find(t => t.id === depId)
    return dep && dep.status !== 'done'
  })
}

function statusLabel(s: TaskStatus): string {
  const labels: Record<TaskStatus, string> = { todo: 'Te doen', doing: 'Bezig', blocked: 'Geblokkeerd', done: 'Klaar' }
  return labels[s] || s
}

function teamColor(team: TeamType): string {
  const colors: Record<TeamType, string> = {
    UX: 'bg-purple-100 text-purple-700',
    Content: 'bg-yellow-100 text-yellow-700',
    SEO: 'bg-green-100 text-green-700',
    Dev: 'bg-blue-100 text-blue-700',
    PM: 'bg-gray-100 text-gray-700',
  }
  return colors[team] || 'bg-gray-100 text-gray-700'
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })
}
</script>
