import axios from 'axios'
import type { ApiResponse } from '@shared/types'

const api = axios.create({ baseURL: '/api' })

// Generieke helper: retourneert data of gooit error
export async function apiFetch<T>(method: string, url: string, body?: unknown): Promise<T> {
  const res = await api.request<ApiResponse<T>>({ method, url, data: body })
  if (!res.data.ok) throw new Error(res.data.error ?? 'Onbekende fout')
  return res.data.data as T
}

export default api
