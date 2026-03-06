<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-bold text-gray-900">Fase 1 · User Stories → Klantvragen</h3>
        <p class="text-sm text-gray-500 mt-1">Vertaal user stories naar concrete vragen voor de klant. Groepeer en beantwoord vragen om inzichten op te bouwen.</p>
      </div>
      <div class="flex gap-2">
        <button class="btn-secondary btn-sm" @click="showImportSources = !showImportSources">📄 Bronnen bekijken</button>
        <button class="btn-primary btn-sm" @click="showNewStory = true">+ User Story</button>
      </div>
    </div>

    <!-- Beschikbare bronnen (collapse) -->
    <div v-if="showImportSources" class="card p-4">
      <h4 class="font-semibold text-sm text-gray-700 mb-2">📄 Beschikbare input uit het project</h4>
      <p class="text-xs text-gray-500 mb-3">Dit zijn bronnen uit de Bronnen-tab (transcripties, notities, etc.) die je kunt gebruiken als input voor user stories.</p>
      <div v-if="projectStore.sources.length === 0" class="text-sm text-gray-400 italic">Nog geen bronnen beschikbaar. Voeg ze toe via de Bronnen-tab.</div>
      <div v-else class="space-y-2">
        <div v-for="source in projectStore.sources" :key="source.id" class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
          <span class="text-lg">{{ sourceIcon(source.type) }}</span>
          <div class="flex-1 min-w-0">
            <div class="font-medium text-sm text-gray-800">{{ source.title }}</div>
            <div class="text-xs text-gray-500 mt-0.5 line-clamp-2">{{ source.contentText.substring(0, 150) }}{{ source.contentText.length > 150 ? '...' : '' }}</div>
            <div class="flex gap-1 mt-1">
              <span v-for="tag in source.tags" :key="tag" class="text-[10px] bg-pienter-100 text-pienter-700 rounded px-1.5 py-0.5">{{ tag }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- User Stories lijst -->
    <div v-if="store.userStories.length === 0 && !showNewStory" class="empty-state card p-12">
      <div class="text-4xl mb-4">📝</div>
      <h3 class="text-lg font-semibold text-gray-700">Nog geen user stories</h3>
      <p>Voeg user stories toe om te beginnen met het opstellen van klantvragen.</p>
      <button class="btn-primary btn-sm mt-4" @click="showNewStory = true">+ Eerste user story toevoegen</button>
    </div>

    <!-- New Story form -->
    <div v-if="showNewStory" class="card p-5">
      <h4 class="font-semibold text-gray-900 mb-3">Nieuwe User Story</h4>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Als een... (doelgroep)</label>
          <input v-model="newStory.asA" class="input" placeholder="bijv. potentiële klant" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Wil ik... (actie/behoefte)</label>
          <input v-model="newStory.iWant" class="input" placeholder="bijv. informatie over koeldiensten vinden" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Zodat ik... (doel)</label>
          <input v-model="newStory.soThat" class="input" placeholder="bijv. kan beoordelen of dit bedrijf bij mij past" />
        </div>
      </div>
      <div class="mb-4">
        <label class="block text-xs font-medium text-gray-600 mb-1">Titel (korte samenvatting)</label>
        <input v-model="newStory.title" class="input" :placeholder="storyTitleSuggestion" />
      </div>
      <div class="flex gap-2">
        <button class="btn-primary btn-sm" @click="addStory" :disabled="!newStory.asA || !newStory.iWant">Opslaan</button>
        <button class="btn-secondary btn-sm" @click="showNewStory = false">Annuleren</button>
      </div>
    </div>

    <!-- Stories + Questions -->
    <div v-for="story in store.userStories" :key="story.id" class="card overflow-hidden">
      <div class="p-4 bg-gray-50 border-b border-gray-100">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-sm font-semibold text-gray-900">{{ story.title || storyLabel(story) }}</span>
              <span class="text-[10px] bg-pienter-100 text-pienter-700 rounded-full px-2 py-0.5">{{ questionsForStory(story.id).length }} vragen</span>
            </div>
            <p class="text-xs text-gray-600">
              Als een <strong>{{ story.asA }}</strong>, wil ik <strong>{{ story.iWant }}</strong>, zodat ik <strong>{{ story.soThat }}</strong>.
            </p>
          </div>
          <div class="flex gap-1 ml-3">
            <button class="btn-tertiary btn-sm text-xs" @click="generateQuestions(story.id)" :disabled="generatingFor === story.id">
              {{ generatingFor === story.id ? '⏳ Genereren...' : '🤖 Genereer vragen' }}
            </button>
            <button class="btn-secondary btn-sm text-xs" @click="addManualQuestion(story.id)">+ Vraag</button>
            <button class="text-gray-400 hover:text-red-500 p-1" @click="removeStory(story.id)" title="Verwijder">🗑</button>
          </div>
        </div>
      </div>

      <!-- Questions for this story -->
      <div v-if="questionsForStory(story.id).length === 0" class="p-4 text-center text-sm text-gray-400">
        Nog geen vragen. Klik op "Genereer vragen" voor automatische suggesties of voeg handmatig een vraag toe.
      </div>
      <div v-else class="divide-y divide-gray-100">
        <div v-for="q in questionsForStory(story.id)" :key="q.id" class="p-4 hover:bg-gray-50 transition-colors">
          <div class="flex items-start gap-3">
            <span class="mt-0.5 text-lg cursor-pointer" @click="cycleStatus(q)" :title="statusTooltip(q.status)">{{ statusIcon(q.status) }}</span>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span :class="groupBadgeClass(q.group)" class="text-[10px] rounded-full px-2 py-0.5 font-medium">{{ q.group }}</span>
                <span :class="statusBadgeClass(q.status)" class="text-[10px] rounded-full px-2 py-0.5">{{ statusLabel(q.status) }}</span>
              </div>
              <!-- Question text (editable) -->
              <div v-if="editingQuestion === q.id" class="space-y-2">
                <textarea v-model="editQuestionText" class="textarea text-sm" rows="2" />
                <div>
                  <label class="block text-xs text-gray-500 mb-1">Antwoord</label>
                  <textarea v-model="editAnswerText" class="textarea text-sm" rows="2" placeholder="Voer hier het antwoord van de klant in..." />
                </div>
                <div>
                  <label class="block text-xs text-gray-500 mb-1">Impact op structuur</label>
                  <input v-model="editImpactText" class="input text-sm" placeholder="Kort: wat betekent dit voor de sitestructuur?" />
                </div>
                <div class="flex items-center gap-2">
                  <select v-model="editGroup" class="select text-xs w-auto">
                    <option v-for="g in groups" :key="g" :value="g">{{ g }}</option>
                  </select>
                  <select v-model="editStatus" class="select text-xs w-auto">
                    <option value="open">Open</option>
                    <option value="answered">Beantwoord</option>
                    <option value="assumption">Aanname</option>
                    <option value="insight">Inzicht</option>
                  </select>
                  <button class="btn-primary btn-sm text-xs" @click="saveQuestion(q)">Opslaan</button>
                  <button class="btn-secondary btn-sm text-xs" @click="editingQuestion = null">Annuleer</button>
                </div>
              </div>
              <div v-else>
                <p class="text-sm text-gray-800 cursor-pointer" @click="startEditQuestion(q)">{{ q.question }}</p>
                <p v-if="q.answer" class="text-xs text-green-700 bg-green-50 rounded p-2 mt-2">💬 {{ q.answer }}</p>
                <p v-if="q.impactOnStructure" class="text-xs text-pienter-700 bg-pienter-50 rounded p-2 mt-1">🏗️ {{ q.impactOnStructure }}</p>
              </div>
            </div>
            <button class="text-gray-300 hover:text-red-400 text-xs" @click="removeQuestion(q.id)" title="Verwijder">✕</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Standalone vragen (niet gekoppeld aan story) -->
    <div v-if="standaloneQuestions.length > 0" class="card overflow-hidden">
      <div class="p-4 bg-gray-50 border-b border-gray-100">
        <span class="text-sm font-semibold text-gray-700">📋 Losse vragen (niet gekoppeld aan user story)</span>
      </div>
      <div class="divide-y divide-gray-100">
        <div v-for="q in standaloneQuestions" :key="q.id" class="p-4 hover:bg-gray-50">
          <div class="flex items-start gap-3">
            <span class="mt-0.5 text-lg cursor-pointer" @click="cycleStatus(q)">{{ statusIcon(q.status) }}</span>
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <span :class="groupBadgeClass(q.group)" class="text-[10px] rounded-full px-2 py-0.5 font-medium">{{ q.group }}</span>
                <span :class="statusBadgeClass(q.status)" class="text-[10px] rounded-full px-2 py-0.5">{{ statusLabel(q.status) }}</span>
              </div>
              <p class="text-sm text-gray-800 cursor-pointer" @click="startEditQuestion(q)">{{ q.question }}</p>
              <p v-if="q.answer" class="text-xs text-green-700 bg-green-50 rounded p-2 mt-2">💬 {{ q.answer }}</p>
            </div>
            <button class="text-gray-300 hover:text-red-400 text-xs" @click="removeQuestion(q.id)">✕</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Statistieken balk -->
    <div class="grid grid-cols-4 gap-4">
      <div class="card p-4 text-center">
        <div class="text-2xl font-bold text-gray-400">{{ store.openQuestions.length }}</div>
        <div class="text-xs text-gray-500 mt-1">Open</div>
      </div>
      <div class="card p-4 text-center">
        <div class="text-2xl font-bold text-green-600">{{ store.answeredQuestions.length }}</div>
        <div class="text-xs text-gray-500 mt-1">Beantwoord</div>
      </div>
      <div class="card p-4 text-center">
        <div class="text-2xl font-bold text-amber-600">{{ store.assumptions.length }}</div>
        <div class="text-xs text-gray-500 mt-1">Aannames</div>
      </div>
      <div class="card p-4 text-center">
        <div class="text-2xl font-bold text-pienter-600">{{ store.insights.length }}</div>
        <div class="text-xs text-gray-500 mt-1">Inzichten</div>
      </div>
    </div>

    <!-- Filter op groep -->
    <div class="card p-4">
      <h4 class="font-semibold text-sm text-gray-700 mb-3">Vragen per categorie</h4>
      <div class="flex flex-wrap gap-2">
        <button v-for="g in groups" :key="g"
          class="text-xs rounded-full px-3 py-1.5 font-medium transition-colors"
          :class="activeGroup === g ? 'bg-pienter-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
          @click="activeGroup = activeGroup === g ? null : g"
        >
          {{ g }} ({{ questionsByGroup(g).length }})
        </button>
      </div>
      <div v-if="activeGroup" class="mt-4 space-y-2">
        <div v-for="q in questionsByGroup(activeGroup)" :key="q.id" class="flex items-center gap-2 p-2 bg-gray-50 rounded-lg text-sm">
          <span>{{ statusIcon(q.status) }}</span>
          <span class="flex-1 text-gray-700">{{ q.question }}</span>
          <span :class="statusBadgeClass(q.status)" class="text-[10px] rounded-full px-2 py-0.5">{{ statusLabel(q.status) }}</span>
        </div>
      </div>
    </div>

    <!-- Samenvatting genereren -->
    <div class="card p-5">
      <div class="flex items-center justify-between mb-3">
        <h4 class="font-semibold text-gray-900">📊 Fase 1 Samenvatting</h4>
        <button class="btn-primary btn-sm" @click="generateSummary" :disabled="generatingSummary">
          {{ generatingSummary ? '⏳ Genereren...' : '🤖 Samenvatting genereren' }}
        </button>
      </div>
      <p class="text-xs text-gray-500 mb-4">Op basis van alle beantwoorde vragen, aannames en inzichten wordt een compact overzicht gegenereerd.</p>

      <div v-if="store.fase1Summary" class="space-y-4">
        <div>
          <h5 class="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">✅ Hoofdonderwerpen die terugkomen</h5>
          <ul class="space-y-1">
            <li v-for="(topic, i) in store.fase1Summary.mainTopics" :key="i" class="text-sm text-gray-700 flex items-center gap-2">
              <span class="w-1.5 h-1.5 rounded-full bg-green-400" /> {{ topic }}
            </li>
          </ul>
        </div>
        <div v-if="store.fase1Summary.uncertainTopics.length">
          <h5 class="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">⚠️ Nog onzekere onderdelen</h5>
          <ul class="space-y-1">
            <li v-for="(topic, i) in store.fase1Summary.uncertainTopics" :key="i" class="text-sm text-amber-700 flex items-center gap-2">
              <span class="w-1.5 h-1.5 rounded-full bg-amber-400" /> {{ topic }}
            </li>
          </ul>
        </div>
        <div v-if="store.fase1Summary.seoImportantPages.length">
          <h5 class="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">🔍 Belangrijk voor vindbaarheid</h5>
          <ul class="space-y-1">
            <li v-for="(p, i) in store.fase1Summary.seoImportantPages" :key="i" class="text-sm text-pienter-700 flex items-center gap-2">
              <span class="w-1.5 h-1.5 rounded-full bg-pienter-400" /> {{ p }}
            </li>
          </ul>
        </div>
        <div v-if="store.fase1Summary.bundleOpportunities.length">
          <h5 class="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">🔗 Mogelijk bundelen op één pagina</h5>
          <ul class="space-y-1">
            <li v-for="(b, i) in store.fase1Summary.bundleOpportunities" :key="i" class="text-sm text-gray-700 flex items-center gap-2">
              <span class="w-1.5 h-1.5 rounded-full bg-purple-400" /> {{ b }}
            </li>
          </ul>
        </div>
        <div v-if="store.fase1Summary.pendingFromClient.length">
          <h5 class="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">📩 Nog aan te leveren door klant</h5>
          <ul class="space-y-1">
            <li v-for="(p, i) in store.fase1Summary.pendingFromClient" :key="i" class="text-sm text-red-600 flex items-center gap-2">
              <span class="w-1.5 h-1.5 rounded-full bg-red-400" /> {{ p }}
            </li>
          </ul>
        </div>
      </div>
      <div v-else class="text-sm text-gray-400 text-center py-6">
        Nog geen samenvatting gegenereerd. Beantwoord eerst enkele vragen en klik dan op "Samenvatting genereren".
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useStructuurStore } from '../../stores/structuurStore'
import { useProjectStore } from '../../stores/projectStore'
import type { ClientQuestion, QuestionGroup, QuestionStatus } from '@shared/types'

const props = defineProps<{ projectId: string }>()
const store = useStructuurStore()
const projectStore = useProjectStore()

const showImportSources = ref(false)
const showNewStory = ref(false)
const generatingFor = ref<string | null>(null)
const generatingSummary = ref(false)
const editingQuestion = ref<string | null>(null)
const editQuestionText = ref('')
const editAnswerText = ref('')
const editImpactText = ref('')
const editGroup = ref<QuestionGroup>('content')
const editStatus = ref<QuestionStatus>('open')
const activeGroup = ref<QuestionGroup | null>(null)

const groups: QuestionGroup[] = ['navigatie', 'doelgroep', 'content', 'seo', 'functionaliteit', 'beeldmateriaal', 'conversie']

const newStory = ref({ title: '', asA: '', iWant: '', soThat: '' })

const storyTitleSuggestion = computed(() => {
  if (newStory.value.asA && newStory.value.iWant) return `${newStory.value.asA} – ${newStory.value.iWant}`
  return 'Automatisch op basis van de velden hierboven'
})

function questionsForStory(storyId: string) {
  return store.clientQuestions.filter(q => q.userStoryId === storyId)
}

const standaloneQuestions = computed(() => store.clientQuestions.filter(q => !q.userStoryId))

function questionsByGroup(group: QuestionGroup) {
  return store.clientQuestions.filter(q => q.group === group)
}

function sourceIcon(type: string) {
  const icons: Record<string, string> = { transcript: '🎙️', note: '📝', link: '🔗', file: '📎' }
  return icons[type] || '📄'
}

function storyLabel(story: { asA: string; iWant: string }) {
  return `${story.asA} – ${story.iWant}`
}

async function addStory() {
  if (!newStory.value.asA || !newStory.value.iWant) return
  const title = newStory.value.title || `${newStory.value.asA} – ${newStory.value.iWant}`
  await store.createStory(props.projectId, { ...newStory.value, title })
  newStory.value = { title: '', asA: '', iWant: '', soThat: '' }
  showNewStory.value = false
}

async function removeStory(storyId: string) {
  if (!confirm('User story verwijderen? Gekoppelde vragen blijven bestaan.')) return
  await store.deleteStory(props.projectId, storyId)
}

async function generateQuestions(storyId: string) {
  generatingFor.value = storyId
  try {
    await store.generateQuestionsForStory(props.projectId, storyId)
  } finally {
    generatingFor.value = null
  }
}

async function addManualQuestion(storyId: string) {
  await store.createQuestion(props.projectId, { userStoryId: storyId, question: 'Nieuwe vraag...', group: 'content' })
}

async function removeQuestion(questionId: string) {
  await store.deleteQuestion(props.projectId, questionId)
}

function startEditQuestion(q: ClientQuestion) {
  editingQuestion.value = q.id
  editQuestionText.value = q.question
  editAnswerText.value = q.answer
  editImpactText.value = q.impactOnStructure
  editGroup.value = q.group
  editStatus.value = q.status
}

async function saveQuestion(q: ClientQuestion) {
  await store.updateQuestion(props.projectId, q.id, {
    question: editQuestionText.value,
    answer: editAnswerText.value,
    impactOnStructure: editImpactText.value,
    group: editGroup.value,
    status: editStatus.value
  })
  editingQuestion.value = null
}

async function cycleStatus(q: ClientQuestion) {
  const order: QuestionStatus[] = ['open', 'answered', 'assumption', 'insight']
  const currentIdx = order.indexOf(q.status)
  const nextStatus = order[(currentIdx + 1) % order.length]
  await store.updateQuestion(props.projectId, q.id, { status: nextStatus })
}

function statusIcon(s: QuestionStatus) {
  return { open: '⬜', answered: '✅', assumption: '⚠️', insight: '💡' }[s]
}
function statusLabel(s: QuestionStatus) {
  return { open: 'Open', answered: 'Beantwoord', assumption: 'Aanname', insight: 'Inzicht' }[s]
}
function statusTooltip(s: QuestionStatus) {
  return `Klik om status te wisselen (nu: ${statusLabel(s)})`
}
function statusBadgeClass(s: QuestionStatus) {
  return {
    open: 'bg-gray-100 text-gray-600',
    answered: 'bg-green-100 text-green-700',
    assumption: 'bg-amber-100 text-amber-700',
    insight: 'bg-blue-100 text-blue-700'
  }[s]
}
function groupBadgeClass(g: QuestionGroup) {
  const colors: Record<QuestionGroup, string> = {
    navigatie: 'bg-indigo-100 text-indigo-700',
    doelgroep: 'bg-pink-100 text-pink-700',
    content: 'bg-emerald-100 text-emerald-700',
    seo: 'bg-orange-100 text-orange-700',
    functionaliteit: 'bg-cyan-100 text-cyan-700',
    beeldmateriaal: 'bg-purple-100 text-purple-700',
    conversie: 'bg-red-100 text-red-700'
  }
  return colors[g] || 'bg-gray-100 text-gray-600'
}

async function generateSummary() {
  generatingSummary.value = true
  try {
    await store.generateFase1Summary(props.projectId)
  } finally {
    generatingSummary.value = false
  }
}
</script>
