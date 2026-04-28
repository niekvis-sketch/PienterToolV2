// ============================================================
// Pienter Portaal – Server Entry Point
// ============================================================
import express from 'express'
import cors from 'cors'
import path from 'path'
import { projectRouter } from './routes/projects'
import { seedRouter } from './routes/seed'
import { structuurRouter } from './routes/structuur'
import { doelgroepenRouter } from './routes/doelgroepen'
import { componentenRouter } from './routes/componenten'
import { contentStructuurRouter } from './routes/contentStructuur'
import { klantenRouter } from './routes/klanten'
import { slidesRouter } from './routes/slides'

const app = express()
const PORT = process.env.PORT || 3210

app.use(cors())
app.use(express.json({ limit: '5mb' }))

// Routes
app.use('/api/projects', projectRouter)
app.use('/api/structuur', structuurRouter)
app.use('/api/doelgroepen', doelgroepenRouter)
app.use('/api/componenten', componentenRouter)
app.use('/api/content-structuur', contentStructuurRouter)
app.use('/api/klanten', klantenRouter)
app.use('/api/slides', slidesRouter)
app.use('/api', seedRouter)

// Serveer geüploade bestanden (afbeeldingen)
app.use('/api/uploads', express.static(path.resolve(__dirname, '../data/uploads')))

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, data: { status: 'running', time: new Date().toISOString() } })
})

app.listen(PORT, () => {
  console.log(`✅ Pienter Portaal server draait op http://localhost:${PORT}`)
})

export default app
