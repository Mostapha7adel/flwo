import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/axios'

export function useSiteSettings() {
  return useQuery({
    queryKey: ['site-settings'],
    queryFn: () => api.get('/landing/content').then(r => r.data),
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
  })
}
