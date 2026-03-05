<template>
  <div>
    <h2 class="text-xl font-bold text-gray-900 mb-1">Instellingen & Developer Setup</h2>
    <p class="text-sm text-gray-500 mb-6">Projectconfiguratie, domeinkeuzes, tracking en development-tooling</p>

    <!-- Project instellingen -->
    <div class="card p-5 mb-6">
      <h3 class="font-semibold text-gray-900 mb-4">Projectinstellingen</h3>
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Huidig domein</label>
            <input v-model="settings.domainCurrent" class="input" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Nieuw domein</label>
            <input v-model="settings.domainNew" class="input" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Go-live datum</label>
            <input v-model="settings.goLiveDate" type="date" class="input" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Talen</label>
            <div class="flex gap-3 mt-1">
              <label class="flex items-center gap-1 text-sm"><input type="checkbox" value="nl" v-model="settings.languages" /> NL</label>
              <label class="flex items-center gap-1 text-sm"><input type="checkbox" value="en" v-model="settings.languages" /> EN</label>
            </div>
          </div>
        </div>

        <h4 class="font-medium text-gray-700 pt-2">Tracking & Technical</h4>
        <div class="grid grid-cols-3 gap-4">
          <label class="flex items-center gap-2 card p-3 cursor-pointer hover:bg-gray-50">
            <input type="checkbox" v-model="settings.stagingNoindex" class="rounded" />
            <div>
              <div class="text-sm font-medium">Staging noindex</div>
              <div class="text-xs text-gray-500">Voorkomt indexering op staging</div>
            </div>
          </label>
          <label class="flex items-center gap-2 card p-3 cursor-pointer hover:bg-gray-50">
            <input type="checkbox" v-model="settings.gtmConnected" class="rounded" />
            <div>
              <div class="text-sm font-medium">GTM gekoppeld</div>
              <div class="text-xs text-gray-500">Google Tag Manager actief</div>
            </div>
          </label>
          <label class="flex items-center gap-2 card p-3 cursor-pointer hover:bg-gray-50">
            <input type="checkbox" v-model="settings.eventsDefined" class="rounded" />
            <div>
              <div class="text-sm font-medium">Events ingesteld</div>
              <div class="text-xs text-gray-500">Formulier/conversie tracking</div>
            </div>
          </label>
        </div>
        <button class="btn-primary btn-sm" @click="saveSettings">Instellingen opslaan</button>
        <span v-if="saved" class="text-sm text-green-600 ml-3">✓ Opgeslagen</span>
      </div>
    </div>

    <!-- Dev setup checklist -->
    <div class="card p-5 mb-6">
      <h3 class="font-semibold text-gray-900 mb-4">Developer Setup Checklist</h3>
      <p class="text-sm text-gray-500 mb-4">Onderstaande stappen zijn nodig om een lokale development-omgeving op te zetten. Dit is een checklist-simulatie om het handwerk zichtbaar te maken.</p>
      <div class="space-y-2">
        <label v-for="(item, i) in devChecklist" :key="i" class="flex items-start gap-3 p-2 rounded hover:bg-gray-50">
          <input type="checkbox" v-model="item.done" class="mt-0.5 rounded" />
          <div>
            <div class="text-sm font-medium" :class="{ 'line-through text-gray-400': item.done }">{{ item.title }}</div>
            <div class="text-xs text-gray-500">{{ item.description }}</div>
          </div>
        </label>
      </div>
    </div>

    <!-- Genereer scripts -->
    <div class="grid grid-cols-2 gap-6">
      <div class="card p-5">
        <h3 class="font-semibold text-gray-900 mb-3">Setup Script Generator</h3>
        <p class="text-sm text-gray-500 mb-3">Genereer een shell-script met alle stappen om de lokale omgeving op te zetten.</p>
        <button class="btn-primary btn-sm mb-3" @click="showSetupScript = !showSetupScript">
          {{ showSetupScript ? 'Verberg script' : 'Genereer setup script' }}
        </button>
        <pre v-if="showSetupScript" class="bg-gray-900 text-green-400 text-xs p-4 rounded-lg overflow-x-auto whitespace-pre leading-relaxed">{{ setupScript }}</pre>
      </div>

      <div class="card p-5">
        <h3 class="font-semibold text-gray-900 mb-3">Migratie Plan Generator</h3>
        <p class="text-sm text-gray-500 mb-3">Genereer een stappenplan voor de migratie van staging naar live.</p>
        <button class="btn-primary btn-sm mb-3" @click="showMigrationPlan = !showMigrationPlan">
          {{ showMigrationPlan ? 'Verberg plan' : 'Genereer migratie plan' }}
        </button>
        <div v-if="showMigrationPlan" class="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-700 space-y-3 leading-relaxed">
          <div v-for="(step, i) in migrationSteps" :key="i">
            <div class="font-medium text-gray-900">Stap {{ i + 1 }}: {{ step.title }}</div>
            <p class="text-xs text-gray-600 mt-0.5">{{ step.description }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, computed } from 'vue'
import { useProjectStore } from '../../stores/projectStore'

const store = useProjectStore()
const saved = ref(false)
const showSetupScript = ref(false)
const showMigrationPlan = ref(false)

const settings = reactive({
  domainCurrent: '',
  domainNew: '',
  goLiveDate: '',
  languages: ['nl'] as string[],
  stagingNoindex: true,
  gtmConnected: false,
  eventsDefined: false,
})

onMounted(() => {
  const p = store.currentProject
  if (p) {
    settings.domainCurrent = p.domainCurrent
    settings.domainNew = p.domainNew
    settings.goLiveDate = p.goLiveDate || ''
    settings.languages = [...p.languages]
    settings.stagingNoindex = p.stagingNoindex
    settings.gtmConnected = p.gtmConnected
    settings.eventsDefined = p.eventsDefined
  }
})

async function saveSettings() {
  if (!store.currentProject) return
  await store.updateProject(store.currentProject.id, {
    ...settings,
    goLiveDate: settings.goLiveDate || null,
    languages: settings.languages as ('nl' | 'en')[],
  })
  saved.value = true
  setTimeout(() => saved.value = false, 2000)
}

const devChecklist = reactive([
  { title: 'Git repository\'s clonen', description: 'Clone het basisthema, child-theme en plugin repo. Zorg dat je toegang hebt tot de Bitbucket/GitHub organisatie.', done: false },
  { title: 'Local WordPress installatie', description: 'Gebruik Local by Flywheel of Docker om een lokale WordPress omgeving op te zetten.', done: false },
  { title: 'Database importeren', description: 'Download de staging-database en importeer deze in je lokale omgeving.', done: false },
  { title: 'Search & Replace URL\'s', description: `Vervang staging URL's door lokale URL's met WP-CLI of een plugin. staging → localhost.`, done: false },
  { title: 'Plugins activeren', description: 'Activeer alle benodigde plugins (ACF Pro, Yoast/RankMath, Gravity Forms, etc.).', done: false },
  { title: 'Thema compileren', description: 'Draai npm install en npm run dev in de thema-directory voor CSS/JS compilatie.', done: false },
  { title: 'Media synchroniseren', description: 'Kopieer de uploads-map van staging of gebruik een remote media plugin.', done: false },
  { title: 'SSL certificaat lokaal', description: 'Configureer een lokaal SSL-certificaat voor HTTPS development.', done: false },
])

const setupScript = computed(() => {
  const domain = store.currentProject?.domainNew || 'voorbeeld.nl'
  const client = store.currentProject?.clientName || 'client'
  return `#!/bin/bash
# =============================================
# Setup script voor ${client}
# Gegenereerd door Pienter Website Proces Portaal
# =============================================

echo "🚀 Start lokale development setup..."

# Stap 1: Repository's clonen
echo "📥 Clonen van repository's..."
git clone git@bitbucket.org:pienter/${domain}-theme.git
git clone git@bitbucket.org:pienter/${domain}-plugin.git
git clone git@bitbucket.org:pienter/pienter-base-theme.git

# Stap 2: WordPress configureren
echo "⚙️ WordPress configureren..."
cd ${domain}-theme
cp .env.example .env
# Pas de database-gegevens aan in .env

# Stap 3: Dependencies installeren
echo "📦 Dependencies installeren..."
composer install
npm install
npm run build

# Stap 4: Database importeren
echo "🗄️ Database importeren..."
wp db import staging-dump.sql

# Stap 5: URL's vervangen
echo "🔄 URL's vervangen..."
wp search-replace 'https://staging.${domain}' 'https://${domain}.local' --all-tables

# Stap 6: Permalinks flushen
echo "🔗 Permalinks vernieuwen..."
wp rewrite flush

# Stap 7: Cache legen
echo "🧹 Cache legen..."
wp cache flush

echo "✅ Setup compleet! Open https://${domain}.local in je browser."
`
})

const migrationSteps = [
  { title: 'Backup maken', description: 'Maak een volledige backup van zowel de staging-database als de bestanden. Bewaar deze op een veilige locatie.' },
  { title: 'Content freeze', description: 'Communiceer met de klant dat er geen content meer aangepast mag worden tot de migratie voltooid is.' },
  { title: 'Database exporteren', description: 'Exporteer de staging-database via WP-CLI of phpMyAdmin.' },
  { title: 'Database importeren op live', description: 'Importeer de database op de live-server en voer een search-replace uit voor alle URL\'s.' },
  { title: 'Bestanden synchroniseren', description: 'Kopieer thema, plugins en uploads naar de live-server via SFTP of deployment pipeline.' },
  { title: 'DNS wijzigen', description: `Pas de DNS-records aan zodat ${store.currentProject?.domainNew || 'het nieuwe domein'} naar de live-server wijst. Let op TTL-instellingen.` },
  { title: 'SSL certificaat activeren', description: 'Activeer het SSL-certificaat op de live-server (Let\'s Encrypt of anders).' },
  { title: 'Redirects instellen', description: `Configureer alle 301-redirects van ${store.currentProject?.domainCurrent || 'het oude domein'} naar het nieuwe domein.` },
  { title: 'Noindex uitzetten', description: 'Verwijder de noindex-tag op de live-omgeving zodat zoekmachines de site kunnen indexeren.' },
  { title: 'Tracking verifiëren', description: 'Controleer of GTM, GA4 en alle events correct werken op de live-omgeving.' },
  { title: 'Sitemap indienen', description: 'Dien de XML-sitemap in bij Google Search Console en Bing Webmaster Tools.' },
  { title: 'Monitoring instellen', description: 'Stel uptime-monitoring en error-tracking in voor de eerste weken na launch.' },
]
</script>
