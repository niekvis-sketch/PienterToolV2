// ============================================================
// JSON File Storage – simpele persistentie voor prototype
// Leest/schrijft JSON-bestanden in /server/data/
// ============================================================
import fs from 'fs'
import path from 'path'

const DATA_DIR = path.resolve(__dirname, '../../data')

// Zorg dat de data-map bestaat
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

function filePath(collection: string): string {
  return path.join(DATA_DIR, `${collection}.json`)
}

export function readCollection<T>(collection: string): T[] {
  const fp = filePath(collection)
  if (!fs.existsSync(fp)) return []
  const raw = fs.readFileSync(fp, 'utf-8')
  try {
    return JSON.parse(raw) as T[]
  } catch {
    return []
  }
}

export function writeCollection<T>(collection: string, data: T[]): void {
  fs.writeFileSync(filePath(collection), JSON.stringify(data, null, 2), 'utf-8')
}

// ---------- Per-project document storage ----------
// Bewaart één JSON-document per project onder data/{collection}/{projectId}.json.
// Gebruikt voor genest opgeslagen domeinen (bv. concurrenten) i.p.v. één platte
// collectie-array.
export function readProjectDoc<T>(collection: string, projectId: string, fallback: T): T {
  const fp = path.join(DATA_DIR, collection, `${projectId}.json`)
  if (!fs.existsSync(fp)) return fallback
  try {
    return JSON.parse(fs.readFileSync(fp, 'utf-8')) as T
  } catch {
    return fallback
  }
}

export function writeProjectDoc<T>(collection: string, projectId: string, data: T): void {
  const dir = path.join(DATA_DIR, collection)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, `${projectId}.json`), JSON.stringify(data, null, 2), 'utf-8')
}

export function clearAll(): void {
  const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'))
  for (const f of files) {
    fs.unlinkSync(path.join(DATA_DIR, f))
  }
}
