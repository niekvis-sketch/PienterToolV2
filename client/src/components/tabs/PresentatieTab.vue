<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-xl font-bold text-gray-900">Presentaties</h1>
        <p class="text-sm text-gray-500 mt-1">Stel modulaire presentaties samen per klantgesprek of sessie</p>
      </div>
      <button
        class="bg-pienter-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-pienter-700 transition-colors"
        @click="startWizard"
      >
        + Nieuwe presentatie
      </button>
    </div>

    <!-- Sessie overzicht -->
    <div v-if="presStore.loading" class="text-center py-12 text-gray-400">Laden...</div>
    <div v-else-if="presStore.sessies.length === 0" class="text-center py-16">
      <div class="text-4xl mb-3">🎬</div>
      <p class="text-gray-500 text-sm mb-1">Nog geen presentaties aangemaakt.</p>
      <p class="text-gray-400 text-xs max-w-md mx-auto mb-4">
        Kies een sessietype, stel slides samen en start een presentatie voor je klantgesprek.
      </p>
      <button
        class="mt-2 bg-pienter-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-pienter-700"
        @click="startWizard"
      >
        Maak je eerste presentatie
      </button>
    </div>
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="sessie in presStore.sessies"
        :key="sessie.id"
        class="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-lg">{{ sessieTypeIcon(sessie.sessieType) }}</span>
              <span class="text-[10px] font-medium uppercase tracking-wide px-1.5 py-0.5 rounded-full"
                :class="sessieTypeBadgeClass(sessie.sessieType)">
                {{ sessieTypeLabel(sessie.sessieType) }}
              </span>
            </div>
            <h3 class="font-semibold text-gray-900 truncate">{{ sessie.name }}</h3>
            <p class="text-xs text-gray-400 mt-1">
              {{ new Date(sessie.createdAt).toLocaleDateString('nl-NL') }}
              · {{ sessie.slides.filter(s => s.enabled).length }} slides
            </p>
          </div>
        </div>
        <!-- Slide badges -->
        <div class="flex flex-wrap gap-1 mt-3">
          <span
            v-for="slide in sessie.slides.filter(s => s.enabled).slice(0, 5)"
            :key="slide.type"
            class="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500"
          >{{ slideLabel(slide.type) }}</span>
          <span
            v-if="sessie.slides.filter(s => s.enabled).length > 5"
            class="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-400"
          >+{{ sessie.slides.filter(s => s.enabled).length - 5 }}</span>
        </div>
        <div class="flex gap-2 mt-4">
          <button
            class="flex-1 bg-pienter-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-pienter-700"
            @click="startPresentatie(sessie.id)"
          >
            ▶ Presenteren
          </button>
          <button
            class="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50"
            @click="openEdit(sessie)"
          >
            Bewerken
          </button>
          <button
            class="px-3 py-1.5 rounded-lg text-xs font-medium border border-red-200 text-red-600 hover:bg-red-50"
            @click="confirmDelete(sessie)"
          >
            ✕
          </button>
        </div>
      </div>
    </div>

    <!-- ===================== WIZARD MODAL ===================== -->
    <div v-if="showWizard" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50" @click.self="closeWizard">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        <!-- Header -->
        <div class="p-6 border-b border-gray-100 shrink-0">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-lg font-bold text-gray-900">
                {{ editingSessie ? 'Presentatie bewerken' : 'Nieuwe presentatie' }}
              </h2>
              <p class="text-sm text-gray-500 mt-0.5">
                {{ editingSessie ? 'Pas slides en instellingen aan' : wizardStepDescription }}
              </p>
            </div>
            <div v-if="!editingSessie" class="flex items-center gap-1">
              <div
                v-for="s in 3"
                :key="s"
                class="w-2 h-2 rounded-full transition-colors"
                :class="s <= wizardStep ? 'bg-pienter-500' : 'bg-gray-200'"
              ></div>
            </div>
          </div>
        </div>

        <!-- Body -->
        <div class="flex-1 overflow-y-auto p-6">

          <!-- STEP 1: Sessietype kiezen -->
          <div v-if="wizardStep === 1 && !editingSessie">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                v-for="st in sessieTypes"
                :key="st.key"
                class="text-left border rounded-xl p-4 transition-all"
                :class="wizardForm.sessieType === st.key
                  ? 'border-pienter-500 bg-pienter-50 ring-1 ring-pienter-500'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'"
                @click="wizardForm.sessieType = st.key"
              >
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-xl">{{ st.icon }}</span>
                  <span class="font-semibold text-sm text-gray-900">{{ st.label }}</span>
                </div>
                <p class="text-xs text-gray-500 leading-relaxed">{{ st.description }}</p>
              </button>
            </div>
          </div>

          <!-- STEP 2: Slides selecteren -->
          <div v-if="wizardStep === 2 || editingSessie">
            <!-- Naam & stijl (bovenaan bij edit, of in stap 2 bij wizard) -->
            <div class="mb-5 space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Sessienaam</label>
                <input
                  v-model="wizardForm.name"
                  type="text"
                  class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pienter-500 focus:border-pienter-500"
                  :placeholder="defaultNameForType(wizardForm.sessieType)"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Presentatiestijl</label>
                <div class="flex gap-2">
                  <button
                    v-for="st in styles"
                    :key="st.key"
                    class="border rounded-lg px-3 py-2 text-xs font-medium transition-colors"
                    :class="wizardForm.style === st.key
                      ? 'border-pienter-500 bg-pienter-50 text-pienter-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'"
                    @click="wizardForm.style = st.key"
                  >
                    {{ st.icon }} {{ st.label }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Slides per categorie -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-3">Slides samenstellen</label>
              <div class="space-y-4">
                <div v-for="cat in slideCategories" :key="cat.key">
                  <div
                    class="flex items-center gap-2 mb-1.5 cursor-pointer select-none"
                    @click="toggleCategory(cat.key)"
                  >
                    <span class="text-sm">{{ cat.icon }}</span>
                    <span class="text-xs font-semibold text-gray-600 uppercase tracking-wide">{{ cat.label }}</span>
                    <span class="text-[10px] text-gray-400">({{ slidesInCategory(cat.key).length }})</span>
                  </div>
                  <div class="space-y-0.5 ml-5">
                    <label
                      v-for="slide in slidesInCategory(cat.key)"
                      :key="slide.type"
                      class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer group"
                      :class="{ 'opacity-50': slide.required }"
                    >
                      <input
                        v-model="slide.enabled"
                        type="checkbox"
                        :disabled="slide.required"
                        class="rounded border-gray-300 text-pienter-600 focus:ring-pienter-500"
                      />
                      <div class="flex-1 min-w-0">
                        <span class="text-sm">{{ slideLabel(slide.type) }}</span>
                        <span v-if="slide.required" class="ml-1.5 text-[10px] text-pienter-500 font-medium">verplicht</span>
                      </div>
                      <!-- Notitie-indicator -->
                      <button
                        class="text-gray-300 group-hover:text-gray-400 hover:!text-pienter-500 transition-colors text-xs"
                        :class="{ '!text-pienter-500': slide.notes }"
                        @click.prevent="toggleSlideNotes(slide)"
                        title="Presentatienotitie"
                      >
                        📝
                      </button>
                    </label>
                    <!-- Inline notitie -->
                    <div
                      v-if="activeNoteSlide === slidesInCategory(cat.key).find(s => s === activeNoteSlideObj)?.type"
                      class="ml-8 mb-2"
                    >
                      <textarea
                        v-model="activeNoteSlideObj!.notes"
                        class="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs resize-none focus:ring-1 focus:ring-pienter-500 focus:border-pienter-500"
                        rows="2"
                        placeholder="Notitie voor tijdens de presentatie..."
                      ></textarea>
                    </div>
                  </div>
                </div>

                <!-- Extra slides toevoegen -->
                <div class="border-t border-gray-100 pt-3">
                  <button
                    class="text-xs text-pienter-600 hover:text-pienter-700 font-medium"
                    @click="showExtraSlides = !showExtraSlides"
                  >
                    {{ showExtraSlides ? '▾ Verberg extra slides' : '▸ Toon alle beschikbare slides' }}
                  </button>
                  <div v-if="showExtraSlides" class="mt-3 space-y-3">
                    <div v-for="cat in slideCategories.filter(c => c.key !== 'custom')" :key="'extra-' + cat.key">
                      <div v-if="extraSlidesInCategory(cat.key).length > 0">
                        <span class="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{{ cat.label }}</span>
                        <div class="space-y-0.5 mt-1">
                          <button
                            v-for="slide in extraSlidesInCategory(cat.key)"
                            :key="slide.type"
                            class="flex items-center gap-2 w-full text-left px-3 py-1.5 rounded-lg hover:bg-pienter-50 text-xs text-gray-600 transition-colors"
                            @click="addSlide(slide.type)"
                          >
                            <span class="text-pienter-500">+</span>
                            {{ slideLabel(slide.type) }}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Screenshot slides toevoegen -->
                <div class="border-t border-gray-100 pt-3">
                  <div class="flex items-center gap-2 mb-2">
                    <span class="text-sm">🖼️</span>
                    <span class="text-xs font-semibold text-gray-600 uppercase tracking-wide">Screenshot slides</span>
                  </div>
                  <p class="text-xs text-gray-400 mb-3 ml-5">
                    Voeg vrije slides toe met screenshots. Upload afbeeldingen die tijdens de presentatie worden getoond.
                  </p>

                  <!-- Bestaande screenshot slides -->
                  <div class="space-y-2 ml-5 mb-3">
                    <div
                      v-for="(slide, sIdx) in screenshotSlides"
                      :key="'ss-' + sIdx"
                      class="border border-gray-200 rounded-lg p-3"
                    >
                      <div class="flex items-center gap-2 mb-2">
                        <input
                          v-model="slide.enabled"
                          type="checkbox"
                          class="rounded border-gray-300 text-pienter-600 focus:ring-pienter-500"
                        />
                        <input
                          v-model="slide.title"
                          type="text"
                          class="flex-1 border border-gray-200 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-pienter-500 focus:border-pienter-500"
                          :placeholder="'Screenshot slide ' + (sIdx + 1)"
                        />
                        <button
                          class="text-red-400 hover:text-red-600 text-xs px-1"
                          @click="removeScreenshotSlide(slide)"
                          title="Slide verwijderen"
                        >✕</button>
                      </div>

                      <!-- Upload area -->
                      <div
                        class="border-2 border-dashed border-gray-200 rounded-lg p-3 text-center hover:border-pienter-400 transition-colors cursor-pointer"
                        @click="triggerScreenshotUpload(slide)"
                        @dragover.prevent="onDragOver"
                        @dragleave.prevent="onDragLeave"
                        @drop.prevent="(e) => onDropScreenshot(e, slide)"
                      >
                        <!-- Uploaded images -->
                        <div v-if="slide.imagePaths && slide.imagePaths.length > 0" class="space-y-2">
                          <div
                            v-for="(imgPath, imgIdx) in slide.imagePaths"
                            :key="imgIdx"
                            class="relative group inline-block mr-2"
                          >
                            <img
                              :src="'/api/' + imgPath"
                              class="h-20 rounded border border-gray-200 object-cover"
                              :alt="'Screenshot ' + (imgIdx + 1)"
                            />
                            <button
                              class="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              @click.stop="removeScreenshotImage(slide, imgIdx)"
                            >✕</button>
                          </div>
                          <p class="text-[10px] text-gray-400 mt-2">Klik of sleep om meer toe te voegen</p>
                        </div>
                        <div v-else>
                          <span class="text-2xl block mb-1">📸</span>
                          <p class="text-xs text-gray-400">Klik of sleep een screenshot hierheen</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    class="ml-5 text-xs text-pienter-600 hover:text-pienter-700 font-medium flex items-center gap-1"
                    @click="addScreenshotSlide"
                  >
                    <span>+</span> Screenshot slide toevoegen
                  </button>

                  <!-- Hidden file input for screenshots -->
                  <input
                    ref="screenshotFileInput"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    class="hidden"
                    @change="onScreenshotFileSelected"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- STEP 3: Overzicht -->
          <div v-if="wizardStep === 3 && !editingSessie">
            <div class="bg-gray-50 rounded-xl p-5 space-y-3">
              <div class="flex items-center gap-3">
                <span class="text-2xl">{{ sessieTypeIcon(wizardForm.sessieType) }}</span>
                <div>
                  <h3 class="font-semibold text-gray-900">{{ wizardForm.name || defaultNameForType(wizardForm.sessieType) }}</h3>
                  <p class="text-xs text-gray-500">{{ sessieTypeLabel(wizardForm.sessieType) }}</p>
                </div>
              </div>
              <div class="border-t border-gray-200 pt-3">
                <p class="text-xs font-medium text-gray-600 mb-2">{{ enabledSlideCount }} slides geselecteerd:</p>
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="slide in wizardForm.slides.filter(s => s.enabled).sort((a, b) => a.sortOrder - b.sortOrder)"
                    :key="slide.type"
                    class="text-[11px] px-2 py-0.5 rounded-full"
                    :class="slide.required ? 'bg-pienter-100 text-pienter-700' : 'bg-gray-100 text-gray-600'"
                  >
                    {{ slideLabel(slide.type) }}
                    <span v-if="slide.notes" class="ml-0.5">📝</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-6 border-t border-gray-100 flex justify-between shrink-0">
          <button
            v-if="wizardStep > 1 && !editingSessie"
            class="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100"
            @click="wizardStep--"
          >
            ← Vorige
          </button>
          <div v-else></div>
          <div class="flex gap-2">
            <button
              class="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100"
              @click="closeWizard"
            >
              Annuleren
            </button>
            <button
              v-if="editingSessie"
              class="bg-pienter-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-pienter-700"
              @click="saveSessie"
            >
              Opslaan
            </button>
            <button
              v-else-if="wizardStep < 3"
              class="bg-pienter-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-pienter-700"
              :disabled="wizardStep === 1 && !wizardForm.sessieType"
              @click="nextWizardStep"
            >
              Volgende →
            </button>
            <button
              v-else
              class="bg-pienter-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-pienter-700"
              @click="saveSessie"
            >
              Aanmaken & starten
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Verwijder bevestiging -->
    <div v-if="deletingSessie" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50" @click.self="deletingSessie = null">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
        <h3 class="font-semibold text-gray-900">Presentatie verwijderen?</h3>
        <p class="text-sm text-gray-500 mt-2">
          Weet je zeker dat je "{{ deletingSessie.name }}" wilt verwijderen? Dit kan niet ongedaan worden gemaakt.
        </p>
        <div class="flex justify-end gap-2 mt-5">
          <button class="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100" @click="deletingSessie = null">Annuleren</button>
          <button class="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700" @click="doDelete">Verwijderen</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectStore } from '../../stores/projectStore'
import { usePresentatieStore } from '../../stores/presentatieStore'
import type {
  PresentatieSessie,
  PresentatieSlideType,
  PresentatieSlideConfig,
  PresentatieSessieType,
  PresentatieSlideCategory,
} from '@shared/types'

const router = useRouter()
const projectStore = useProjectStore()
const presStore = usePresentatieStore()

const showWizard = ref(false)
const wizardStep = ref(1)
const editingSessie = ref<PresentatieSessie | null>(null)
const deletingSessie = ref<PresentatieSessie | null>(null)
const showExtraSlides = ref(false)
const activeNoteSlide = ref<PresentatieSlideType | null>(null)
const screenshotFileInput = ref<HTMLInputElement | null>(null)
const activeScreenshotSlide = ref<PresentatieSlideConfig | null>(null)
let screenshotCounter = 0

// -- Sessietypes --
const sessieTypes: { key: PresentatieSessieType; label: string; icon: string; description: string }[] = [
  { key: 'intake', label: 'Intakepresentatie', icon: '🤝', description: 'Voor een eerste gesprek met een klant. Bespreek doel, doelgroep, planning en budget.' },
  { key: 'websitesessie', label: 'Websitesessie', icon: '🌐', description: 'Strategische sessie met klant en team. Visie, missie, doelgroepen, user stories en klantreis.' },
  { key: 'structuur', label: 'Structuurpresentatie', icon: '🗂️', description: 'Bespreek de sitemap, paginadoelen, zoekthema\'s en prioriteiten.' },
  { key: 'design', label: 'Designpresentatie', icon: '🎨', description: 'Toon de visuele richting: stijl, kleuren, componenten en voorbeeldpagina\'s.' },
  { key: 'content', label: 'Contentbespreking', icon: '📝', description: 'Bespreek content-status, wie wat schrijft, beeldmateriaal en zoekthema\'s.' },
  { key: 'intern-overdracht', label: 'Interne overdracht', icon: '🔄', description: 'Intern gebruik: projectsamenvatting, sitemap, componenten en functionele toelichting.' },
]

const styles: { key: PresentatieSessie['style']; label: string; icon: string }[] = [
  { key: 'pienter', label: 'Pienter', icon: '🟢' },
  { key: 'light', label: 'Licht', icon: '☀️' },
  { key: 'dark', label: 'Donker', icon: '🌙' },
]

// -- Slide definities --
interface SlideDef {
  type: PresentatieSlideType
  label: string
  category: PresentatieSlideCategory | 'custom'
}

const allSlideDefinitions: SlideDef[] = [
  // Project
  { type: 'introductie', label: 'Introductie', category: 'project' },
  { type: 'projectdoel', label: 'Projectdoel', category: 'project' },
  { type: 'planning', label: 'Planning & budget', category: 'project' },
  { type: 'rollen-teams', label: 'Rollen & teams', category: 'project' },
  // Strategie
  { type: 'visie', label: 'Bedrijfsvisie', category: 'strategie' },
  { type: 'missie', label: 'Bedrijfsmissie', category: 'strategie' },
  { type: 'doelgroepen', label: 'Doelgroepen', category: 'strategie' },
  { type: 'doelgroeppaspoort', label: 'Doelgroeppaspoort', category: 'strategie' },
  { type: 'klantreis', label: 'Klantreis (STDC)', category: 'strategie' },
  { type: 'user-stories', label: 'User stories', category: 'strategie' },
  { type: 'merkwaarden', label: 'Merkwaarden', category: 'strategie' },
  { type: 'kernwaarden', label: 'Kernwaarden', category: 'strategie' },
  { type: 'concurrenten-inspiratie', label: 'Concurrenten & inspiratie', category: 'strategie' },
  // Structuur
  { type: 'sitemap', label: 'Sitemap / hoofdstructuur', category: 'structuur' },
  { type: 'paginas', label: 'Pagina\'s & subpagina\'s', category: 'structuur' },
  { type: 'paginadoel', label: 'Doel per pagina', category: 'structuur' },
  { type: 'pagina-prioriteit', label: 'Pagina-prioriteiten', category: 'structuur' },
  { type: 'componenten-per-pagina', label: 'Componenten per pagina', category: 'structuur' },
  { type: 'zoekthemas', label: 'Zoekthema\'s per pagina', category: 'structuur' },
  // Content
  { type: 'contentstatus', label: 'Contentstatus', category: 'content' },
  { type: 'wie-schrijft-wat', label: 'Wie schrijft wat', category: 'content' },
  { type: 'beeldmateriaal', label: 'Beeldmateriaal', category: 'content' },
  { type: 'content-ontbreekt', label: 'Content die nog ontbreekt', category: 'content' },
  // Design
  { type: 'stijlrichting', label: 'Visuele stijlrichting', category: 'design' },
  { type: 'kleur-typografie', label: 'Kleur & typografie', category: 'design' },
  { type: 'componentvoorbeeld', label: 'Componentvoorbeelden', category: 'design' },
  { type: 'voorbeeldpagina', label: 'Voorbeeldpagina\'s', category: 'design' },
  { type: 'design-doelgroep-match', label: 'Match doelgroep & doel', category: 'design' },
  { type: 'feedbackpunten', label: 'Feedbackpunten', category: 'design' },
  // Technisch
  { type: 'functionaliteiten', label: 'Functionaliteiten', category: 'technisch' },
  { type: 'integraties', label: 'Integraties', category: 'technisch' },
  { type: 'functionele-toelichting', label: 'Functionele toelichting', category: 'technisch' },
  { type: 'overdracht-development', label: 'Overdracht naar development', category: 'technisch' },
  { type: 'openstaande-punten', label: 'Openstaande punten', category: 'technisch' },
  { type: 'risicos', label: 'Risico\'s & aandachtspunten', category: 'technisch' },
  // Afronding
  { type: 'samenvatting', label: 'Samenvatting', category: 'afronding' },
  { type: 'besluiten', label: 'Besluiten', category: 'afronding' },
  { type: 'actiepunten', label: 'Actiepunten', category: 'afronding' },
  { type: 'volgende-stap', label: 'Volgende stap', category: 'afronding' },
  // Custom
  { type: 'screenshot', label: 'Screenshot slide', category: 'custom' },
]

const slideCategories: { key: PresentatieSlideCategory | 'custom'; label: string; icon: string }[] = [
  { key: 'project', label: 'Project', icon: '📋' },
  { key: 'strategie', label: 'Strategie', icon: '🧭' },
  { key: 'structuur', label: 'Structuur', icon: '🗂️' },
  { key: 'content', label: 'Content', icon: '✍️' },
  { key: 'design', label: 'Design', icon: '🎨' },
  { key: 'technisch', label: 'Technisch', icon: '⚙️' },
  { key: 'afronding', label: 'Afronding', icon: '✅' },
  { key: 'custom', label: 'Screenshot slides', icon: '🖼️' },
]

// -- Slide-presets per sessietype (client-side for wizard) --
const sessionSlidePresets: Record<PresentatieSessieType, { type: PresentatieSlideType; required: boolean }[]> = {
  intake: [
    { type: 'introductie', required: true },
    { type: 'projectdoel', required: true },
    { type: 'doelgroepen', required: false },
    { type: 'functionaliteiten', required: false },
    { type: 'planning', required: false },
    { type: 'rollen-teams', required: false },
    { type: 'volgende-stap', required: true },
  ],
  websitesessie: [
    { type: 'introductie', required: true },
    { type: 'visie', required: false },
    { type: 'missie', required: false },
    { type: 'doelgroepen', required: false },
    { type: 'doelgroeppaspoort', required: false },
    { type: 'user-stories', required: false },
    { type: 'klantreis', required: false },
    { type: 'merkwaarden', required: false },
    { type: 'kernwaarden', required: false },
    { type: 'concurrenten-inspiratie', required: false },
    { type: 'beeldmateriaal', required: false },
    { type: 'functionaliteiten', required: false },
    { type: 'paginas', required: false },
    { type: 'volgende-stap', required: true },
  ],
  structuur: [
    { type: 'introductie', required: true },
    { type: 'sitemap', required: false },
    { type: 'paginas', required: false },
    { type: 'paginadoel', required: false },
    { type: 'zoekthemas', required: false },
    { type: 'pagina-prioriteit', required: false },
    { type: 'content-ontbreekt', required: false },
    { type: 'volgende-stap', required: true },
  ],
  design: [
    { type: 'introductie', required: true },
    { type: 'stijlrichting', required: false },
    { type: 'kleur-typografie', required: false },
    { type: 'componentvoorbeeld', required: false },
    { type: 'voorbeeldpagina', required: false },
    { type: 'design-doelgroep-match', required: false },
    { type: 'feedbackpunten', required: false },
    { type: 'volgende-stap', required: true },
  ],
  content: [
    { type: 'introductie', required: true },
    { type: 'contentstatus', required: false },
    { type: 'wie-schrijft-wat', required: false },
    { type: 'beeldmateriaal', required: false },
    { type: 'zoekthemas', required: false },
    { type: 'content-ontbreekt', required: false },
    { type: 'actiepunten', required: false },
    { type: 'volgende-stap', required: true },
  ],
  'intern-overdracht': [
    { type: 'introductie', required: true },
    { type: 'samenvatting', required: false },
    { type: 'projectdoel', required: false },
    { type: 'sitemap', required: false },
    { type: 'paginas', required: false },
    { type: 'componenten-per-pagina', required: false },
    { type: 'functionele-toelichting', required: false },
    { type: 'openstaande-punten', required: false },
    { type: 'risicos', required: false },
    { type: 'volgende-stap', required: true },
  ],
}

// -- Wizard form --
const wizardForm = ref({
  name: '',
  sessieType: 'websitesessie' as PresentatieSessieType,
  style: 'pienter' as PresentatieSessie['style'],
  slides: [] as PresentatieSlideConfig[],
})

const wizardStepDescription = computed(() => {
  switch (wizardStep.value) {
    case 1: return 'Kies het type sessie waarvoor je een presentatie wilt maken'
    case 2: return 'Stel de slides samen en geef de presentatie een naam'
    case 3: return 'Controleer je presentatie en start'
    default: return ''
  }
})

const enabledSlideCount = computed(() => wizardForm.value.slides.filter(s => s.enabled).length)

const activeNoteSlideObj = computed(() =>
  wizardForm.value.slides.find(s => s.type === activeNoteSlide.value) || null
)

// -- Helpers --
function slideLabel(type: PresentatieSlideType): string {
  return allSlideDefinitions.find(d => d.type === type)?.label || type
}

function slideCategory(type: PresentatieSlideType): PresentatieSlideCategory | 'custom' {
  return allSlideDefinitions.find(d => d.type === type)?.category || 'project'
}

function sessieTypeLabel(type: PresentatieSessieType): string {
  return sessieTypes.find(s => s.key === type)?.label || type
}

function sessieTypeIcon(type: PresentatieSessieType): string {
  return sessieTypes.find(s => s.key === type)?.icon || '🎬'
}

function sessieTypeBadgeClass(type: PresentatieSessieType): string {
  const map: Record<PresentatieSessieType, string> = {
    intake: 'bg-blue-100 text-blue-700',
    websitesessie: 'bg-emerald-100 text-emerald-700',
    structuur: 'bg-violet-100 text-violet-700',
    design: 'bg-pink-100 text-pink-700',
    content: 'bg-amber-100 text-amber-700',
    'intern-overdracht': 'bg-gray-100 text-gray-700',
  }
  return map[type] || 'bg-gray-100 text-gray-700'
}

function defaultNameForType(type: PresentatieSessieType): string {
  const project = projectStore.currentProject
  const prefix = project ? project.clientName + ' – ' : ''
  return prefix + sessieTypeLabel(type)
}

function slidesInCategory(cat: PresentatieSlideCategory | 'custom'): PresentatieSlideConfig[] {
  return wizardForm.value.slides
    .filter(s => slideCategory(s.type) === cat)
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

function extraSlidesInCategory(cat: PresentatieSlideCategory | 'custom'): SlideDef[] {
  // For custom category, don't show extras (user adds them via button)
  if (cat === 'custom') return []
  const currentTypes = new Set(wizardForm.value.slides.map(s => s.type))
  return allSlideDefinitions.filter(d => d.category === cat && !currentTypes.has(d.type))
}

function toggleCategory(_cat: PresentatieSlideCategory) {
  // Could expand/collapse — for now it's a no-op since we always show
}

function toggleSlideNotes(slide: PresentatieSlideConfig) {
  activeNoteSlide.value = activeNoteSlide.value === slide.type ? null : slide.type
}

function addSlide(type: PresentatieSlideType) {
  const maxOrder = Math.max(0, ...wizardForm.value.slides.map(s => s.sortOrder))
  wizardForm.value.slides.push({
    type,
    enabled: true,
    required: false,
    sortOrder: maxOrder + 1,
    notes: '',
  })
}

// -- Screenshot slides --
const screenshotSlides = computed(() =>
  wizardForm.value.slides
    .filter(s => s.type === 'screenshot')
    .sort((a, b) => a.sortOrder - b.sortOrder)
)

function addScreenshotSlide() {
  screenshotCounter++
  const maxOrder = Math.max(0, ...wizardForm.value.slides.map(s => s.sortOrder))
  wizardForm.value.slides.push({
    type: 'screenshot',
    enabled: true,
    required: false,
    sortOrder: maxOrder + 1,
    notes: '',
    title: '',
    imagePaths: [],
  })
}

function removeScreenshotSlide(slide: PresentatieSlideConfig) {
  // If editing existing sessie, delete images from server
  if (editingSessie.value && slide.imagePaths?.length) {
    const projectId = projectStore.currentProject!.id
    const slideIdx = editingSessie.value.slides.findIndex(s => s === slide)
    if (slideIdx >= 0) {
      // Delete all images for this slide
      for (let i = slide.imagePaths.length - 1; i >= 0; i--) {
        presStore.deleteSlideImage(projectId, editingSessie.value.id, slideIdx, i)
      }
    }
  }
  const idx = wizardForm.value.slides.indexOf(slide)
  if (idx >= 0) wizardForm.value.slides.splice(idx, 1)
}

function triggerScreenshotUpload(slide: PresentatieSlideConfig) {
  activeScreenshotSlide.value = slide
  screenshotFileInput.value?.click()
}

function onDragOver(e: DragEvent) {
  (e.currentTarget as HTMLElement)?.classList.add('border-pienter-500', 'bg-pienter-50/30')
}

function onDragLeave(e: DragEvent) {
  (e.currentTarget as HTMLElement)?.classList.remove('border-pienter-500', 'bg-pienter-50/30')
}

async function onDropScreenshot(e: DragEvent, slide: PresentatieSlideConfig) {
  (e.currentTarget as HTMLElement)?.classList.remove('border-pienter-500', 'bg-pienter-50/30')
  const file = e.dataTransfer?.files[0]
  if (!file || !file.type.startsWith('image/')) return
  await uploadScreenshotToSlide(slide, file)
}

async function onScreenshotFileSelected(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file || !activeScreenshotSlide.value) return
  await uploadScreenshotToSlide(activeScreenshotSlide.value, file)
  input.value = '' // reset for next upload
}

async function uploadScreenshotToSlide(slide: PresentatieSlideConfig, file: File) {
  if (!editingSessie.value) {
    // For new sessie (not yet saved), we need to save the sessie first
    // Store file locally as data URL for preview
    const reader = new FileReader()
    reader.onload = () => {
      if (!slide.imagePaths) slide.imagePaths = []
      // We'll store a placeholder — actual upload happens at save
      slide.imagePaths!.push('__pending__')
      // Store the file for later upload
      pendingUploads.push({ slide, file })
    }
    reader.readAsDataURL(file)
    return
  }

  const projectId = projectStore.currentProject!.id
  const slideIdx = editingSessie.value.slides.findIndex(s =>
    s.type === slide.type && s.sortOrder === slide.sortOrder && s.title === slide.title
  )
  if (slideIdx < 0) return

  await presStore.uploadSlideImage(projectId, editingSessie.value.id, slideIdx, file)
  // Sync back from store
  const updated = presStore.sessies.find(s => s.id === editingSessie.value!.id)
  if (updated) {
    const updatedSlide = updated.slides[slideIdx]
    slide.imagePaths = updatedSlide.imagePaths ? [...updatedSlide.imagePaths] : []
  }
}

async function removeScreenshotImage(slide: PresentatieSlideConfig, imgIdx: number) {
  if (editingSessie.value) {
    const projectId = projectStore.currentProject!.id
    const slideIdx = editingSessie.value.slides.findIndex(s =>
      s.type === slide.type && s.sortOrder === slide.sortOrder && s.title === slide.title
    )
    if (slideIdx >= 0) {
      await presStore.deleteSlideImage(projectId, editingSessie.value.id, slideIdx, imgIdx)
      const updated = presStore.sessies.find(s => s.id === editingSessie.value!.id)
      if (updated) {
        const updatedSlide = updated.slides[slideIdx]
        slide.imagePaths = updatedSlide.imagePaths ? [...updatedSlide.imagePaths] : []
      }
      return
    }
  }
  slide.imagePaths?.splice(imgIdx, 1)
}

// Pending uploads for new sessions
const pendingUploads: { slide: PresentatieSlideConfig; file: File }[] = []

function buildSlidesFromPreset(sessieType: PresentatieSessieType): PresentatieSlideConfig[] {
  const preset = sessionSlidePresets[sessieType]
  return preset.map((s, i) => ({
    type: s.type,
    enabled: true,
    required: s.required,
    sortOrder: i,
    notes: '',
  }))
}

// -- Wizard flow --
function startWizard() {
  editingSessie.value = null
  wizardStep.value = 1
  showExtraSlides.value = false
  activeNoteSlide.value = null
  wizardForm.value = {
    name: '',
    sessieType: 'websitesessie',
    style: 'pienter',
    slides: buildSlidesFromPreset('websitesessie'),
  }
  showWizard.value = true
}

function nextWizardStep() {
  if (wizardStep.value === 1) {
    // Build slides for selected type
    wizardForm.value.slides = buildSlidesFromPreset(wizardForm.value.sessieType)
    wizardForm.value.name = ''
  }
  wizardStep.value++
}

function closeWizard() {
  showWizard.value = false
  editingSessie.value = null
  activeNoteSlide.value = null
}

function openEdit(sessie: PresentatieSessie) {
  editingSessie.value = sessie
  wizardStep.value = 2
  showExtraSlides.value = false
  activeNoteSlide.value = null
  wizardForm.value = {
    name: sessie.name,
    sessieType: sessie.sessieType || 'websitesessie',
    style: sessie.style,
    slides: sessie.slides.map(s => ({
      ...s,
      required: s.required ?? false,
      notes: s.notes ?? '',
    })),
  }
  showWizard.value = true
}

async function saveSessie() {
  const projectId = projectStore.currentProject!.id
  const name = wizardForm.value.name || defaultNameForType(wizardForm.value.sessieType)

  if (editingSessie.value) {
    await presStore.updateSessie(projectId, editingSessie.value.id, {
      name,
      sessieType: wizardForm.value.sessieType,
      style: wizardForm.value.style,
      slides: wizardForm.value.slides,
    })
    closeWizard()
  } else {
    // Clean pending placeholders before saving
    for (const slide of wizardForm.value.slides) {
      if (slide.imagePaths) {
        slide.imagePaths = slide.imagePaths.filter(p => p !== '__pending__')
      }
    }

    const sessie = await presStore.createSessie(projectId, {
      name,
      sessieType: wizardForm.value.sessieType,
      style: wizardForm.value.style,
      slides: wizardForm.value.slides,
    })

    // Upload pending screenshots
    if (pendingUploads.length > 0) {
      for (const pu of pendingUploads) {
        const slideIdx = sessie.slides.findIndex(s =>
          s.type === pu.slide.type && s.sortOrder === pu.slide.sortOrder && s.title === pu.slide.title
        )
        if (slideIdx >= 0) {
          await presStore.uploadSlideImage(projectId, sessie.id, slideIdx, pu.file)
        }
      }
      pendingUploads.length = 0
    }

    closeWizard()
    startPresentatie(sessie.id)
  }
}

function startPresentatie(sessieId: string) {
  const projectId = projectStore.currentProject!.id
  router.push({ name: 'presentatie', params: { id: projectId, sessieId } })
}

function confirmDelete(sessie: PresentatieSessie) {
  deletingSessie.value = sessie
}

async function doDelete() {
  if (!deletingSessie.value) return
  const projectId = projectStore.currentProject!.id
  await presStore.deleteSessie(projectId, deletingSessie.value.id)
  deletingSessie.value = null
}

onMounted(async () => {
  if (projectStore.currentProject) {
    await presStore.fetchSessies(projectStore.currentProject.id)
  }
})
</script>
