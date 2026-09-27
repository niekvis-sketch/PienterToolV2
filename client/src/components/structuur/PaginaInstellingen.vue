<template>
  <div class="space-y-5">
    <!-- Concurrentie-melding voor deze pagina -->
    <div
      v-for="w in conflicts"
      :key="w.nodeId + (w.relatedNodeId ?? '') + w.type"
      class="rounded-lg border border-red-200 bg-red-50 p-3 flex items-start gap-2.5"
      role="alert"
    >
      <KIcon name="alert" :size="16" class="text-red-600 mt-0.5 shrink-0" />
      <div class="flex-1 min-w-0 text-sm text-red-800">
        <p>{{ w.message }}</p>
        <div class="flex flex-wrap gap-2 mt-2">
          <button v-if="otherOf(w)" class="btn-secondary btn-sm" @click="$emit('open-page', otherOf(w)!.id)">
            <KIcon name="arrowR" :size="14" />Open {{ otherOf(w)!.title }}
          </button>
          <button v-if="otherOf(w)" class="btn-secondary btn-sm" @click="$emit('merge', [node.id, otherOf(w)!.id])">
            <KIcon name="merge" :size="14" />Samenvoegen…
          </button>
        </div>
      </div>
    </div>

    <!-- Doel van de pagina -->
    <fieldset>
      <legend class="label">Doel van de pagina</legend>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-2" role="radiogroup" aria-label="Doel van de pagina">
        <button
          v-for="g in GOALS"
          :key="g.value"
          type="button"
          role="radio"
          :aria-checked="node.goal === g.value"
          class="goal-option"
          :class="{ 'is-active': node.goal === g.value }"
          @click="save({ goal: node.goal === g.value ? null : g.value })"
        >
          <span class="flex items-center gap-2 font-semibold text-sm">
            <KIcon :name="g.icon" :size="16" />{{ g.label }}
            <KIcon v-if="node.goal === g.value" name="check" :size="14" stroke-width="2.2" class="ml-auto" />
          </span>
          <span class="block text-xs mt-1 text-left" :class="node.goal === g.value ? 'text-pienter-800' : 'text-gray-500'">{{ g.help }}</span>
        </button>
      </div>
    </fieldset>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Bouwstatus -->
      <div>
        <label class="label" :for="`label-${node.id}`">Bouwen of hergebruiken?</label>
        <select :id="`label-${node.id}`" class="select" :value="node.label" @change="save({ label: ($event.target as HTMLSelectElement).value as SiteNodeLabel })">
          <option v-for="l in LABELS" :key="l.value" :value="l.value">{{ l.label }}</option>
        </select>
        <p class="help">{{ labelHelp }}</p>
      </div>

      <!-- Focus-zoekwoord -->
      <div>
        <label class="label" :for="`focus-${node.id}`">Focus-zoekwoord (SEO)</label>
        <input
          :id="`focus-${node.id}`"
          v-model="draft.focusTopic"
          class="input"
          :aria-invalid="conflicts.length > 0 || undefined"
          placeholder="bijv. bedrijfscatering"
          @blur="saveText('focusTopic')"
          @keyup.enter="saveText('focusTopic')"
        />
        <p class="help">Het zoekwoord waarop deze pagina in Google gevonden moet worden. Elke pagina een eigen zoekwoord.</p>
      </div>

      <!-- Doelgroep -->
      <div>
        <label class="label" :for="`audience-${node.id}`">Voor wie is deze pagina?</label>
        <input
          :id="`audience-${node.id}`"
          v-model="draft.targetAudience"
          class="input"
          placeholder="bijv. HR-managers van middelgrote bedrijven"
          @blur="saveText('targetAudience')"
        />
      </div>

      <!-- Oude URL's -->
      <div>
        <label class="label" :for="`redirect-${node.id}`">Oude URL's die hierheen doorverwijzen</label>
        <div class="flex gap-2">
          <input
            :id="`redirect-${node.id}`"
            v-model="newRedirect"
            class="input mono"
            placeholder="/oude-pagina"
            @keyup.enter="addRedirect"
          />
          <button class="btn-secondary btn-sm !h-auto shrink-0" :disabled="!newRedirect.trim()" @click="addRedirect">
            <KIcon name="plus" :size="14" />Toevoegen
          </button>
        </div>
        <ul v-if="node.redirectsFrom?.length" class="mt-2 space-y-1">
          <li v-for="r in node.redirectsFrom" :key="r" class="flex items-center gap-2 text-xs">
            <span class="mono text-gray-700 truncate">{{ r }}</span>
            <KIcon name="arrowR" :size="12" class="text-gray-400 shrink-0" />
            <span class="mono text-pienter-600 truncate">{{ ownPath }}</span>
            <button class="ml-auto text-gray-300 hover:text-red-500 inline-flex shrink-0" :aria-label="`Doorverwijzing ${r} verwijderen`" @click="removeRedirect(r)">
              <KIcon name="close" :size="13" />
            </button>
          </li>
        </ul>
        <p v-else class="help">Pagina's van de oude website die naar deze pagina moeten verwijzen (301-redirect).</p>
      </div>
    </div>

    <!-- Functionele eisen -->
    <div>
      <label class="label" :for="`req-${node.id}`">Wat moet deze pagina kunnen?</label>
      <textarea
        :id="`req-${node.id}`"
        v-model="draft.requirements"
        class="textarea"
        rows="3"
        placeholder="bijv. offerte aanvragen via een formulier, menukaart downloaden als pdf"
        @blur="saveText('requirements')"
      />
      <p class="help">Functionaliteit die de developer moet bouwen. Welke blokken en componenten de pagina heeft, staat hieronder.</p>
    </div>

    <div class="flex items-center justify-between gap-3 pt-1">
      <span class="text-xs text-gray-400 inline-flex items-center gap-1.5" aria-live="polite">
        <template v-if="savedAt"><KIcon name="check" :size="13" />Opgeslagen</template>
      </span>
      <button class="btn-ghost btn-sm" @click="showMergePicker = !showMergePicker">
        <KIcon name="merge" :size="14" />Samenvoegen met een andere pagina
      </button>
    </div>
    <div v-if="showMergePicker" class="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
      <select v-model="mergeWith" class="select !h-8 text-[13px]" aria-label="Pagina om mee samen te voegen">
        <option value="">— Kies een pagina —</option>
        <option v-for="n in otherNodes" :key="n.id" :value="n.id">{{ indent(n.level) }}{{ n.title }}</option>
      </select>
      <button class="btn-primary btn-sm shrink-0" :disabled="!mergeWith" @click="$emit('merge', [node.id, mergeWith]); showMergePicker = false; mergeWith = ''">
        Verder
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import KIcon from '../ui/KIcon.vue'
import { computed, reactive, ref, watch } from 'vue'
import { useStructuurStore } from '../../stores/structuurStore'
import type { SiteNode, SiteNodeGoal, SiteNodeLabel, StructureWarning } from '@shared/types'
import type { IconName } from '../ui/icons'

const props = defineProps<{ projectId: string; node: SiteNode }>()
defineEmits<{ merge: [ids: [string, string]]; 'open-page': [nodeId: string] }>()
const store = useStructuurStore()

const GOALS: { value: SiteNodeGoal; label: string; icon: IconName; help: string }[] = [
  { value: 'informeren', label: 'Informeren', icon: 'info', help: 'Uitleggen en vragen beantwoorden, bijvoorbeeld wie je bent of hoe iets werkt.' },
  { value: 'overtuigen', label: 'Overtuigen', icon: 'star', help: 'Laten zien waarom de bezoeker voor jou moet kiezen.' },
  { value: 'converteren', label: 'Converteren', icon: 'target', help: 'De bezoeker iets laten doen, zoals een offerte aanvragen of contact opnemen.' },
]

const LABELS: { value: SiteNodeLabel; label: string; help: string }[] = [
  { value: 'nieuw', label: 'Nieuw bouwen', help: 'Deze pagina bestaat nog niet en moet helemaal gebouwd worden.' },
  { value: 'bestaand', label: 'Bestaande pagina hergebruiken', help: 'De pagina bestaat al en gaat ongewijzigd mee naar de nieuwe site.' },
  { value: 'herschrijven', label: 'Bestaand, tekst herschrijven', help: 'De pagina bestaat al; alleen de tekst en indeling worden vernieuwd.' },
  { value: 'migreren', label: 'Migreren van oude site', help: 'Inhoud van de oude site verhuist naar deze pagina.' },
  { value: 'onderzoeken', label: 'Nog uitzoeken', help: 'Nog niet duidelijk of deze pagina nodig is.' },
  { value: 'fase-1', label: 'Livegang fase 1', help: 'Moet klaar zijn bij de eerste livegang.' },
  { value: 'fase-2', label: 'Latere fase', help: 'Wordt na de eerste livegang gebouwd.' },
]

const labelHelp = computed(() => LABELS.find(l => l.value === props.node.label)?.help ?? '')

type TextField = 'focusTopic' | 'targetAudience' | 'requirements'
const draft = reactive<Record<TextField, string>>({ focusTopic: '', targetAudience: '', requirements: '' })
const newRedirect = ref('')
const showMergePicker = ref(false)
const mergeWith = ref('')
const savedAt = ref<number | null>(null)

watch(() => props.node.id, () => {
  draft.focusTopic = props.node.focusTopic ?? ''
  draft.targetAudience = props.node.targetAudience ?? ''
  draft.requirements = props.node.requirements ?? ''
  newRedirect.value = ''
  showMergePicker.value = false
  savedAt.value = null
}, { immediate: true })

const ownPath = computed(() => props.node.fullUrl.replace(/^https?:\/+[^/]+/, '') || '/')

// Inspringing in een <option> (gewone spaties worden daar ingeklapt).
const indent = (level: number) => '   '.repeat(level)

const otherNodes = computed(() => store.flatSortedNodes.filter(n => n.id !== props.node.id && !n.isParked))

// Concurrentie-meldingen waar deze pagina bij betrokken is.
const conflicts = computed(() =>
  store.warnings.filter(w =>
    (w.type === 'keyword-cannibalization' || w.type === 'duplicate')
    && (w.nodeId === props.node.id || w.relatedNodeId === props.node.id),
  ),
)

function otherOf(w: StructureWarning): SiteNode | undefined {
  const id = w.nodeId === props.node.id ? w.relatedNodeId : w.nodeId
  return store.siteNodes.find(n => n.id === id)
}

async function save(patch: Partial<SiteNode>) {
  await store.updateNode(props.projectId, props.node.id, patch)
  savedAt.value = Date.now()
}

function saveText(field: TextField) {
  const value = draft[field].trim()
  if (value === (props.node[field] ?? '')) return
  save({ [field]: value })
}

// "https://oude-site.nl/catering-zakelijk/" → "/catering-zakelijk"
function normalizePath(input: string): string {
  let p = input.trim().replace(/^https?:\/\/[^/]+/i, '').replace(/^www\.[^/]+/i, '')
  if (!p.startsWith('/')) p = '/' + p
  if (p.length > 1) p = p.replace(/\/+$/, '')
  return p
}

function addRedirect() {
  if (!newRedirect.value.trim()) return
  const path = normalizePath(newRedirect.value)
  newRedirect.value = ''
  if (path === ownPath.value || props.node.redirectsFrom?.includes(path)) return
  const redirectsFrom = [...(props.node.redirectsFrom ?? []), path]
  save({ redirectsFrom, needsRedirect: true })
}

function removeRedirect(path: string) {
  const redirectsFrom = (props.node.redirectsFrom ?? []).filter(r => r !== path)
  save({ redirectsFrom, needsRedirect: redirectsFrom.length > 0 })
}
</script>

<style scoped>
.goal-option {
  display: block;
  padding: 10px 12px;
  border: 1px solid var(--line-strong);
  border-radius: var(--r-2);
  background: var(--surface);
  color: var(--ink);
  text-align: left;
  cursor: pointer;
  transition: border-color var(--motion-tint), background var(--motion-tint);
}
.goal-option:hover { border-color: var(--ink-2); }
.goal-option.is-active {
  border-color: var(--primary-strong);
  background: var(--primary-soft);
  color: var(--primary-strong);
}
</style>
