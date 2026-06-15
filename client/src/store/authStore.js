import { create } from 'zustand'
import { api } from '../lib/axios'

export const useAuthStore = create((set) => ({
  user: null,
  accessToken: null,
  isLoading: true,

  init: async () => {
    try {
      const res = await api.post('/auth/refresh')
      if (res.status !== 200) throw new Error()
      set({ user: res.data.user, accessToken: res.data.accessToken, isLoading: false })
    } catch {
      set({ user: null, accessToken: null, isLoading: false })
    }
  },

  login: async (credentials) => {
    try {
      const res = await api.post('/auth/login', credentials)
      set({ user: res.data.user, accessToken: res.data.accessToken })
      return res.data
    } catch (err) {
      throw err
    }
  },

  register: async (data) => {
    const res = await api.post('/auth/register', data)
    set({ user: res.data.user, accessToken: res.data.accessToken })
    return res.data
  },

  logout: async () => {
    try { await api.post('/auth/logout') } catch { }
    set({ user: null, accessToken: null })
  },

  setTokens: (user, accessToken) => set({ user, accessToken })
}))
