// ============================================================
// Pienter Portaal – Server Entry Point
// ============================================================
import express from 'express'
import cors from 'cors'
import { projectRouter } from './routes/projects'
import { auditRouter } from './routes/audit'
import { seedRouter } from './routes/seed'
import { structuurRouter } from './routes/structuur'

const app = express()
const PORT = process.env.PORT || 3210

app.use(cors())
app.use(express.json({ limit: '5mb' }))

// Routes
app.use('/api/projects', projectRouter)
app.use('/api/audit', auditRouter)
app.use('/api/structuur', structuurRouter)
app.use('/api', seedRouter)

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, data: { status: 'running', time: new Date().toISOString() } })
})

app.listen(PORT, () => {
  console.log(`✅ Pienter Portaal server draait op http://localhost:${PORT}`)
})

export default app
