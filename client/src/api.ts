import axios, { type AxiosAdapter } from 'axios'
import type { ApiResponse } from '@shared/types'

// In de statische GitHub Pages demo is er geen server. We zetten dan een
// axios-adapter die alle /api-verzoeken lokaal afhandelt op gebundelde demo-data.
const STATIC_DEMO = import.meta.env.VITE_STATIC_DEMO === 'true'

const staticAdapter: AxiosAdapter = async (config) => {
  const { handle } = await import('./staticApi/handler')
  const method = (config.method || 'get').toUpperCase()
  const url = config.url || ''
  let body: unknown = config.data
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    } catch {
      /* laat als string staan */
    }
  }
  const result = handle(method, url, body)
  return {
    data: result,
    status: result.ok ? 200 : result._status ?? 400,
    statusText: result.ok ? 'OK' : 'Error',
    headers: {},
    config,
  } as any
}

const api = axios.create({
  baseURL: '/api',
  ...(STATIC_DEMO ? { adapter: staticAdapter } : {}),
})

// Generieke helper: retourneert data of gooit error
export async function apiFetch<T>(method: string, url: string, body?: unknown): Promise<T> {
  const res = await api.request<ApiResponse<T>>({ method, url, data: body })
  if (!res.data.ok) throw new Error(res.data.error ?? 'Onbekende fout')
  return res.data.data as T
}

export default api
