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

export function clearAll(): void {
  const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'))
  for (const f of files) {
    fs.unlinkSync(path.join(DATA_DIR, f))
  }
}
