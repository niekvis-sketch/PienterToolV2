# Pienter Website Tool

Interne tool voor klantbeheer, websiteprojecten en sales-presentaties. Vue 3 SPA + Express API + platte JSON-opslag. Dit document beschrijft vooral **hoe de tool genavigeerd wordt** en **hoe content gestructureerd is onder klanten**.

## Tech stack (kort)

- **Monorepo** met root `package.json` die client en server parallel start (`concurrently`).
- **Frontend** [client/](client/): Vue 3 + Vite + TypeScript, Vue Router 4, Pinia, Tailwind CSS, axios.
- **Design system**: Kompas — zie [Design system (Kompas)](#design-system-kompas) hieronder.
- **Backend** [server/](server/): Express + TypeScript, Multer, Zod, `pptxgenjs`. Dev via `tsx watch`.
- **Shared types**: [shared/types.ts](shared/types.ts) gedeeld via path alias `@shared/*`.
- **Opslag**: géén database — platte JSON in [data/](data/), uploads in [data/uploads/](data/uploads/).
- **Dev poorten**: client `:5173` (Vite proxy `/api/*` naar server), server `:3210`.

```bash
npm run install:all
npm run dev          # client + server tegelijk
npm run build        # vue-tsc + vite build, daarna tsc voor server
npm run lint         # client en server
npm test             # server jest tests
```

---

## Navigatie-overzicht

Het scherm bestaat altijd uit **drie navigatie-lagen**, opgebouwd in [App.vue](client/src/App.vue):

```
┌────────────────┬──────────────────────────────────────────────┐
│                │  TOPBAR (breadcrumb)              [Demo mode]│   ← horizontale balk
│                ├──────────────────────────────────────────────┤
│                │                                              │
│   VERTICALE    │   ┌──────────────────────────────────────┐   │
│   SIDEBAR      │   │ TAB-BAR (DetailLayout, optioneel)    │   │   ← horizontale tabs
│                │   ├──────────────────────────────────────┤   │
│   (hoofd-      │   │                                      │   │
│    secties)    │   │   <router-view> content              │   │
│                │   │                                      │   │
│                │   └──────────────────────────────────────┘   │
└────────────────┴──────────────────────────────────────────────┘
```

1. **Verticale sidebar links** ([AppSidebar.vue](client/src/components/AppSidebar.vue)) — hoofdnavigatie tussen domeinen.
2. **Horizontale topbar** ([App.vue](client/src/App.vue)) — breadcrumb + demo-mode badge.
3. **Horizontale tab-bar** ([DetailLayout.vue](client/src/components/DetailLayout.vue)) — sub-navigatie binnen een pagina, alleen aanwezig als de view tabs definieert.

---

## 1. Verticale sidebar ([AppSidebar.vue](client/src/components/AppSidebar.vue))

Vaste breedte 256px (`w-64`), altijd zichtbaar. Drie hoofdsecties die als inklapbare blokken werken via [SidebarSection.vue](client/src/components/SidebarSection.vue):

Bovenaan staat het Kompas-logo (`assets/kompas/kompas-logo.svg`). Sectie-koppen zijn kleine caps-labels; de nav-items zelf hebben een Kompas-icoon.

| Sectie | Open-gedrag | Inhoud |
|--------|-------------|--------|
| **Klanten** | Altijd open (vaste `ref(true)`) | "Alle klanten" + actieve klant + 4 dienst-links |
| **Medewerkers** | Inklapbaar, persistent in `localStorage` (`sidebar.medewerkers.open`) | "Overzicht" |
| **Sales** | Inklapbaar, persistent in `localStorage` (`sidebar.sales.open`) | "Overzicht" + "Vrije slides" |

**Auto-open bij navigatie:** een `watch` op `route.path` klapt Medewerkers/Sales automatisch open zodra je in die sectie bent (zie [AppSidebar.vue:160-163](client/src/components/AppSidebar.vue#L160-L163)).

### Klanten-sectie — dynamische uitbreiding

Zodra je op een klant klikt, verschijnt onder "Alle klanten" een mini-tree met die klant en zijn diensten:

```
Klanten
   ├─ Alle klanten
   └─ {Klantnaam}                          ← actieve klant
       │  (subnav, alleen zichtbaar bij actieve klant)
       ├─ Advertising      → /klanten/:id/advertising
       ├─ SEO              → /klanten/:id/seo
       ├─ Content          → /klanten/:id/content
       └─ Website          → /klanten/:id/website
```

De actieve klant wordt afgeleid uit de URL via een regex op `/klanten/:id` ([AppSidebar.vue:113-118](client/src/components/AppSidebar.vue#L113-L118)) en daarna opgezocht in [klantenStore.ts](client/src/stores/klantenStore.ts). Het actieve sub-segment (advertising/seo/content/website) krijgt een highlight via `activeSegment` ([AppSidebar.vue:130-134](client/src/components/AppSidebar.vue#L130-L134)).

De vier dienst-links zijn hardcoded in [AppSidebar.vue:106-111](client/src/components/AppSidebar.vue#L106-L111):

```ts
const klantSubItems = [
  { segment: 'advertising', label: 'Advertising' },
  { segment: 'seo', label: 'SEO' },
  { segment: 'content', label: 'Content' },
  { segment: 'website', label: 'Website' },
]
```

---

## 2. Horizontale topbar ([App.vue](client/src/App.vue))

Vaste header met automatisch gegenereerde breadcrumb. Geen statische links — de breadcrumb wordt elke route-wissel berekend uit `route.path` plus storedata ([App.vue:61-93](client/src/App.vue#L61-L93)).

**Patroon:** `Sectie › Entiteit › Sub-pagina`

| Pad | Breadcrumb |
|-----|------------|
| `/klanten` | **Klanten** |
| `/klanten/new` | Klanten › **Nieuwe klant** |
| `/klanten/:id` | Klanten › **{Klantnaam}** |
| `/klanten/:id/seo` | Klanten › {Klantnaam} › **SEO** |
| `/sales/slides/:id` | Sales › Vrije slides › **{...}** |
| `/medewerkers` | **Medewerkers** |

- Alle crumbs behalve de laatste zijn `<router-link>` (terugklikbaar). De laatste is in `--ink`; scheidingstekens zijn het `chevR`-icoon.
- Rechts staat altijd een vaste **"Demo mode"** badge (amber) die zichtbaar markeert dat dit een prototype is met platte JSON-opslag.
- Op de root-route is geen breadcrumb; in plaats daarvan staat "Pienter Portaal".

Klantnamen in de breadcrumb komen uit `klantenStore.klanten`. App.vue laadt klanten één keer bij mount via een immediate watcher op `route.name` ([App.vue:48-52](client/src/App.vue#L48-L52)) zodat de breadcrumb meteen werkt.

---

## 3. Horizontale tab-bar ([DetailLayout.vue](client/src/components/DetailLayout.vue))

Veel views gebruiken `<DetailLayout :tabs v-model="activeTab">` als wrapper. DetailLayout rendert dan een **onderstreepte tab-balk bovenaan** (Kompas Tabs: `.tab-nav` / `.tab-item`, optioneel met `icon: IconName`) en de content direct op de crème pagina eronder. Zonder `tabs`-prop is het puur een page-container met vaste marges.

**Belangrijk:** de actieve tab is **lokale Vue state** in elke wrapping-component (`ref('...')`). Hij staat **niet in de URL**. Dat betekent:
- Page refresh → tab springt terug naar default.
- Direct linken naar een specifieke tab kan niet.
- Browser back/forward navigeert niet tussen tabs.

---

## Design system (Kompas)

De hele UI volgt het **Kompas design system** (bron: map `Kompas Design System/` in de repo-root; lees daar `readme.md` voor merkregels). Implementatie in de client:

- **Tokens**: [client/src/styles/kompas/](client/src/styles/kompas/) — letterlijke kopie van `tokens/colors.css`, `typography.css`, `spacing.css`. Bij een nieuwe versie van het design system deze bestanden vervangen.
- **Recipes**: [client/src/style.css](client/src/style.css) — `.btn*`, `.input`/`.select`/`.textarea`, `.badge*`, `.card`, `.avatar`, `.tbl`, `.nav-item`, `.tab-nav`/`.tab-item`, `.empty-state(-icon)`, `.caps`/`.eyebrow`/`.mono`, `.accent-dot`. Alles in `@layer components`, dus Tailwind-utilities winnen bij conflicten.
- **Tailwind**: [client/tailwind.config.js](client/tailwind.config.js) — Poppins als `font-sans`, en de standaardpaletten (`gray`, `green`, `red`, `blue`, `amber`, …) zijn **overschreven met Kompas-tinten**. `text-gray-500` is dus warm Kompas-grijs, `green-600` = `--primary-strong`. Schaduwen/radii zijn afgestemd (max 12px).
- **Iconen**: [KIcon.vue](client/src/components/ui/KIcon.vue) + [icons.ts](client/src/components/ui/icons.ts) (Kompas-set + Pienter-uitbreidingen in dezelfde 1.6px/24px stijl). Domein-mappings (paginatype, bloktype, bestandstype, …) in [iconMaps.ts](client/src/components/ui/iconMaps.ts). **Geen emoji als iconen** — voeg een glyph toe aan `icons.ts` als er één ontbreekt.
- **Kleurgebruik**: `--primary` (#48B070) is decoratief (fills, focus, grafieken); knoppen en groene tekst gebruiken `--primary-strong` (#2C7D49, AA met wit). Roze `--accent` alleen decoratief; `--accent-deep` voor roze tekst.
- **Copy**: Nederlands, sentence case, je/jij, geen emoji, geen uitroeptekens.

---

## Klant-hiërarchie: hoe alles onder een klant hangt

Dit is de centrale informatie-architectuur van de tool.

```
Klant (entiteit in /data/klanten.json)
│
├─ KlantTabs (horizontale tabs op /klanten/:id)        ← admin van de klant zelf
│   ├─ Diensten                 (default tab)
│   ├─ Klantinformatie          (bevat 4 sub-secties)
│   ├─ Commerciële informatie
│   └─ Doelen
│
└─ Diensten (sidebar sub-links op /klanten/:id/{segment})  ← werk per dienst
    ├─ Advertising               (placeholder — "komt eraan")
    ├─ SEO                       (placeholder — "komt eraan")
    ├─ Content                   (placeholder — "komt eraan")
    └─ Website                   (volledig uitgewerkt → ProjectTabs)
        └─ ProjectTabs (5 horizontale tabs binnen de Website-dienst)
            ├─ Doelgroepen        (default)
            ├─ Concurrenten
            ├─ Structuur          (Fase 1 / 2 / 3)
            ├─ Content
            ├─ Componenten
            └─ Instellingen
```

### KlantTabs (4 horizontale tabs op `/klanten/:id`)

Gedefinieerd in [KlantTabs.vue](client/src/components/klanten/KlantTabs.vue). Default = `diensten`.

| Key | Label | Component | Inhoud |
|-----|-------|-----------|--------|
| `diensten` | **Diensten** (`folder`) | [KlantProjectenTab.vue](client/src/components/klanten/KlantProjectenTab.vue) | Lijst van project-kaarten gekoppeld aan deze klant via `project.clientName === klant.naam`. Klikken op een kaart gaat naar `/klanten/:id/website`. Knop "Nieuwe dienst" → `/projects/new?clientName=...` |
| `informatie` | **Klantinformatie** (`building`) | [KlantInformatieTab.vue](client/src/components/klanten/KlantInformatieTab.vue) | Basisvelden + ingebedde sub-secties: KlantContactpersonenSection, KlantHuisstijlSection, KlantDoelgroepenSection, CommunicatieHistorieTab |
| `commercieel` | **Commerciële informatie** (`deals`) | [CommercieleInformatieTab.vue](client/src/components/klanten/CommercieleInformatieTab.vue) | Contracttype, contractwaarde, billing |
| `doelen` | **Doelen** (`target`) | [KlantDoelenTab.vue](client/src/components/klanten/KlantDoelenTab.vue) | Korte- en langetermijndoelen + maandelijkse focuspunten |

Let op: in de **sidebar** is "Diensten" geen aparte link — je komt erbij door op de klantnaam zelf te klikken (`/klanten/:id`), en de Diensten-tab is de default. De vier dienst-links onder de klantnaam in de sidebar gaan rechtstreeks naar `/klanten/:id/{advertising|seo|content|website}`, voorbij de KlantTabs.

### Diensten-pagina's (sidebar sub-links)

Elke dienst heeft een eigen route en eigen view. Drie zijn placeholders, één is volledig uitgewerkt:

| Dienst | View | Status |
|--------|------|--------|
| Advertising | [KlantAdvertisingView.vue](client/src/views/KlantAdvertisingView.vue) | Placeholder — "Advertising komt eraan" |
| SEO | [KlantSeoView.vue](client/src/views/KlantSeoView.vue) | Placeholder — "SEO komt eraan" |
| Content | [KlantContentView.vue](client/src/views/KlantContentView.vue) | Placeholder — "Content komt eraan" |
| Website | [KlantWebsiteView.vue](client/src/views/KlantWebsiteView.vue) | Volledig — laadt project en toont ProjectTabs |

### Website-dienst → ProjectTabs

[KlantWebsiteView.vue](client/src/views/KlantWebsiteView.vue) zoekt het project van de klant op `clientName` en toont dan [ProjectTabs.vue](client/src/components/project/ProjectTabs.vue). Belangrijke gevallen:

- **Geen project gekoppeld** → empty state met knop "Nieuw project aanmaken" (link naar `/projects/new?clientName=...`).
- **Eén project** → ProjectTabs gerenderd voor dat project.
- **Meerdere projecten voor dezelfde klantnaam** → meest recente op `createdAt` wordt gekozen, met `console.warn` ([KlantWebsiteView.vue:42-47](client/src/views/KlantWebsiteView.vue#L42-L47)).

ProjectTabs heeft 5 tabs (default = `doelgroepen`):

| Key | Label | Component |
|-----|-------|-----------|
| `doelgroepen` | Doelgroepen (`target`) | [DoelgroepenTab.vue](client/src/components/tabs/DoelgroepenTab.vue) |
| `structuur` | Structuur (`sitemap`) | [StructuurTab.vue](client/src/components/tabs/StructuurTab.vue) — coördineert Fase 1 / 2 / 3 via [StructuurModule.vue](client/src/components/structuur/StructuurModule.vue) |
| `contentStructuur` | Content (`note`) | [ContentStructuurTab.vue](client/src/components/tabs/ContentStructuurTab.vue) |
| `componenten` | Componenten (`component`) | [ComponentenTab.vue](client/src/components/tabs/ComponentenTab.vue) |
| `instellingen` | Instellingen (`settings`) | [InstellingenTab.vue](client/src/components/tabs/InstellingenTab.vue) |

### Structuur-tab (de 3-fase websitebouwer)

Binnen de **Structuur**-tab van een Website-project zit het kernfeature van de tool, opgedeeld in 3 fases die voortgang bijhouden in `data/structuurProgress.json`:

| Fase | Component | Doel | Data |
|------|-----------|------|------|
| **1 — Vragen** | [Fase1Vragen.vue](client/src/components/structuur/Fase1Vragen.vue) | Discovery: klantvragen + user stories + samenvatting | `clientQuestions.json`, `userStories.json`, `fase1Summaries.json` |
| **2 — Structuur** | [Fase2Structuur.vue](client/src/components/structuur/Fase2Structuur.vue) | Menu, plattegrond en pagina's (instellingen + blok-indeling) | `siteNodes.json`, `pageBlocks.json`, `menus.json` |
| **3 — Figma** | [Fase3Figma.vue](client/src/components/structuur/Fase3Figma.vue) | Export per pagina met componenten, voor het ontwerp in Figma | — |

Fase 4 en 5 zijn placeholders.

**Fase 2 heeft drie weergaven** (lokale state `fase2View`, niet in de URL):

- **Menu** ([MenuStructuurBuilder.vue](client/src/components/structuur/MenuStructuurBuilder.vue)): navigatie opbouwen met slepen of de pijlknoppen voor in- en uitspringen. Het menu staat per project in `menus.json` (`GET/PUT /api/structuur/:projectId/menu`). Zonder opgeslagen menu bouwt de store het op uit de paginastructuur (pagina's met `isInMainNav`), en dat gebeurt ook na een import in een leeg menu. De menu-hiërarchie staat los van de URL-structuur.
- **Plattegrond** ([PlattegrondCanvas.vue](client/src/components/structuur/PlattegrondCanvas.vue)): Vue Flow-canvas van de pagina-hiërarchie.
- **Pagina's** ([Fase3Blokken.vue](client/src/components/structuur/Fase3Blokken.vue)): links de paginalijst, rechts [PaginaInstellingen.vue](client/src/components/structuur/PaginaInstellingen.vue) met:
  - paginadoel (`goal`);
  - bouwen of hergebruiken (`label`);
  - focus-zoekwoord;
  - doelgroep;
  - oude URL's (`redirectsFrom`);
  - "wat moet deze pagina kunnen" (`requirements`).

  Daaronder staan de blokken. De geselecteerde pagina staat in `structuurStore.selectedNodeId`, zodat het menu en de waarschuwingen een pagina kunnen openen.

**Waarschuwingen** komen uit [shared/structuurWarnings.ts](shared/structuurWarnings.ts). Die pure functie gebruiken zowel de server als de statische demo-API. De store vraagt ze na elke structuurwijziging automatisch opnieuw op (`scheduleWarnings`). Pagina's met hetzelfde focus-zoekwoord geven een `keyword-cannibalization`-fout. Die los je op met **samenvoegen** (`POST /nodes/:nodeId/merge`, [SamenvoegenDialog.vue](client/src/components/structuur/SamenvoegenDialog.vue)): de bronpagina verdwijnt en naar het doel verhuizen haar blokken (behalve blokken met een naam die het doel al heeft), haar subpagina's en haar URL (als redirect).

**Herbruikbare blokken**: een origineel heeft `isReusable: true` en `reusableBlockId: null`. Een kopie op een andere pagina verwijst via `reusableBlockId` naar het origineel. Wijzigingen aan het origineel neemt de server over in alle kopieën; in de UI zijn kopieën alleen-lezen. Verdwijnt het origineel, dan worden de kopieën zelfstandig.

**Contentplanning** ([ContentStructuurTab.vue](client/src/components/tabs/ContentStructuurTab.vue)) heeft per pagina een schrijver en een nakijker. De statusflow is: Wordt geschreven → Nakijken door collega (`review`) → Goedgekeurd, mag naar klant (`klaar`). Bij openen wordt de tabel altijd gesynchroniseerd met de structuur; bestaande rijen zonder `siteNodeId` worden op paginanaam gekoppeld.

---

## Routing ([client/src/router.ts](client/src/router.ts))

Alle routes en hun mapping:

```
/                                  → redirect naar /klanten

# Klanten
/klanten                           KlantenView          (lijst)
/klanten/new                       KlantNewView         (aanmaken)
/klanten/:id                       KlantDetailView      (rendert KlantTabs)
/klanten/:id/advertising           KlantAdvertisingView (placeholder)
/klanten/:id/seo                   KlantSeoView         (placeholder)
/klanten/:id/content               KlantContentView     (placeholder)
/klanten/:id/website               KlantWebsiteView     (rendert ProjectTabs)

# Projects (alleen create + legacy redirect)
/projects/new                      ProjectNewView
/projects/:id                      Guard zoekt klant via project.clientName
                                   → redirect naar /klanten/:id/website

# Medewerkers
/medewerkers                       MedewerkersView

# Sales
/sales                             SalesView
/sales/slides                      SlidesOverviewView
/sales/slides/:id                  SlideEditorView

# Backwards-compat
/slides                            → /sales/slides
/slides/:id                        → /sales/slides/:id
```

### Project-koppeling: belangrijk om te weten

Projecten en klanten zijn **niet gekoppeld via id maar via `clientName` (string match)**. Een project heeft een veld `clientName` dat overeen moet komen met `klant.naam`. Implicaties:

- Klantnaam wijzigen breekt de koppeling met bestaande projecten — let op bij rename-acties.
- `/projects/:id` heeft een `beforeEnter` guard ([router.ts:5-22](client/src/router.ts#L5-L22)) die het project ophaalt, de bijbehorende klant zoekt, en redirect naar `/klanten/:klantId/website`. Geen project of klant gevonden → terug naar `/klanten`.
- Bij "Nieuwe dienst" / "Nieuw project aanmaken" wordt `clientName` als query-param meegegeven (`/projects/new?clientName=...`) zodat het formulier voor-ingevuld is.

---

## Belangrijke navigatie-conventies

- **PascalCase** voor componenten. Suffixen met betekenis: `*View.vue` = routebaar, `*Tab.vue` = tab-inhoud, `*Section.vue` = herbruikbare sectie binnen een tab, `*Layout.vue` = wrapper, `*Module.vue` = feature-coördinator (Structuur).
- **Tabs zijn lokale state**, niet in de URL. Voor diepe links zou je tab-state aan een query-param moeten koppelen — gebeurt nu nergens.
- **Sidebar reageert op de URL**, niet op store-state. Je kunt vanuit elke view navigeren door de URL aan te passen; de sidebar past zich aan.
- **Placeholders** (Advertising/SEO/Content) bestaan al als routes en sidebar-links zodat de UI compleet voelt; vul ze in op de view-bestanden zelf.
- **Klantnaam vs id**: in URLs gebruik je altijd `:id` (uuid). De naam is een display-veld dat ook dienstdoet als foreign key naar projects — zie hierboven.

---

## Server- en data-laag (verkort)

API in [server/src/index.ts](server/src/index.ts) met routers per resource ([server/src/routes/](server/src/routes/)). Conventies:
- REST `/api/{resource}`, response envelope `{ ok, data | error }` (zie [server/src/helpers.ts](server/src/helpers.ts)).
- Geen controllers/models — logica direct in route-handlers.
- [server/src/storage.ts](server/src/storage.ts) leest/schrijft `/data/{collection}.json` als platte JSON.
- Multer-uploads naar `data/uploads/{huisstijl|components|slides-free}/`, served via `/api/uploads/*`.

JSON-collecties in [data/](data/) zijn niet onder git (`.gitignore` excludeert `server/data/*.json`). Per domein:

- **Klant-niveau**: `klanten.json`, `klantCommunicatie.json`, `klantContactpersonen.json`, `klantHuisstijl.json`, `klantDoelgroepen.json`, `klantDoelen.json`, `klantDoelFocuspunten.json`.
- **Project / structuur**: `projects.json` (incl. optionele `structuurImportPreset`, die al in het importveld van Fase 2 staat), `structuurProgress.json`, `siteNodes.json`, `pages.json`, `pageBlocks.json`, `seoFields.json`, `components.json`, `menus.json`.
- **Fase 1 / discovery**: `clientQuestions.json`, `userStories.json`, `doelgroepen.json`, `doelgroepVragen.json`, `fase1Summaries.json`.
- **Content planning**: `contentStructuur.json`, `contentStructuurPresets.json`.
- **Sales**: `slidePresentations.json`, `slidePresets.json`.
- **Overig**: `changeLog.json`.

Type-definities in [shared/types.ts](shared/types.ts) (`Klant`, `SiteNode`, `PageBlock`, `Doelgroep`, `Slide`, `ApiResponse<T>`, etc.) gedeeld door client en server.

---

## Niet-vanzelfsprekende dingen

- **Geen database** — alle state is platte JSON. Concurrent writes worden niet beschermd; houd hier rekening mee bij feature-design.
- **Project ↔ klant koppeling op naam** (`clientName` string match), niet op id. Rename = breken.
- **Tab-state niet in URL** — refresh reset elke tab-keuze naar default.
- **Drie van de vier diensten zijn placeholders** (Advertising, SEO, Content). Alleen Website is functioneel.
- **`/projects/:id` is een legacy bridge** die altijd redirect naar de klant-centrische URL. Nieuwe links altijd via `/klanten/:id/website`.
- **Sidebar-state persistent** in `localStorage` voor Medewerkers en Sales — niet voor Klanten (altijd open).
- **Demo mode badge** in topbar is permanent zichtbaar zolang dit een prototype is; verwijder uit `App.vue` als de tool naar productie gaat.
- **PPTX-export** loopt server-side via `pptxgenjs` op `/api/slides`.
