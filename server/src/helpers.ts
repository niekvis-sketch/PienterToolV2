// ============================================================
// Hulp-functies voor de server
// ============================================================
import { v4 as uuidv4 } from 'uuid'

export function genId(): string {
  return uuidv4().split('-')[0] // kort genoeg voor demo
}

export function now(): string {
  return new Date().toISOString()
}

/** Wrap API response */
export function ok<T>(data: T) {
  return { ok: true, data }
}

export function err(message: string, status = 400) {
  return { ok: false, error: message, _status: status }
}
