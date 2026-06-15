import axios from 'axios'
import { useAuthStore } from '../store/authStore'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  timeout: 15000,
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let isRefreshing = false
let failedQueue = []

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config

    // Silently handle 401 for refresh endpoint
    if (original?.url === '/auth/refresh') {
      return Promise.resolve(error.response)
    }

    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          original.headers.Authorization = `Bearer ${token}`
          return api(original)
        })
      }

      original._retry = true
      isRefreshing = true

      try {
        const { data } = await api.post('/auth/refresh')
        useAuthStore.getState().setTokens(data.user, data.accessToken)

        failedQueue.forEach(p => p.resolve(data.accessToken))
        failedQueue = []

        original.headers.Authorization = `Bearer ${data.accessToken}`
        return api(original)
      } catch (refreshError) {
        failedQueue.forEach(p => p.reject(refreshError))
        useAuthStore.getState().logout()
        return Promise.reject(refreshError)
      } finally {
        failedQueue = []
        isRefreshing = false
      }
    }
    return Promise.reject(error)
  }
)
