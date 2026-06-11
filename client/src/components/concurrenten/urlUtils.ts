// Normaliseer een ingevoerde URL. Begint hij niet met http(s), dan plakken we
// https:// ervoor. Geeft de genormaliseerde URL terug, of '' als hij ook na
// normalisatie niet als geldige URL te parsen is (de UI blokkeert niet, maar
// toont een hint).
export function normalizeUrl(raw: string): string {
  const v = (raw || '').trim()
  if (!v) return ''
  const withProto = /^https?:\/\//i.test(v) ? v : `https://${v}`
  try {
    const u = new URL(withProto)
    if (!u.hostname.includes('.')) return ''
    return u.toString().replace(/\/$/, '')
  } catch {
    return ''
  }
}

// Favicon-URL voor een (genormaliseerde) homepage-URL, of '' als niet af te leiden.
export function faviconUrl(raw?: string): string {
  if (!raw) return ''
  const norm = normalizeUrl(raw)
  if (!norm) return ''
  try {
    const u = new URL(norm)
    return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=32`
  } catch {
    return ''
  }
}
