// ============================================================
// Demo-data loader voor de statische (GitHub Pages) demo
// Bundelt alle /data/*.json bestanden in één map { collectionNaam: [...] }
// zodat de client zonder server kan draaien.
// ============================================================

// Vite bundelt elk JSON-bestand uit de repo-root /data map.
// (client/src/staticApi -> ../../../data)
const files = import.meta.glob('../../../data/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, unknown>

export const db: Record<string, any[]> = {}

for (const filePath in files) {
  const name = filePath.split('/').pop()!.replace(/\.json$/, '')
  const value = files[filePath]
  db[name] = Array.isArray(value) ? value : []
}

export function coll(name: string): any[] {
  return db[name] ?? []
}
