import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/axios'

export function useTemplates(filters = {}) {
  return useQuery({
    queryKey: ['templates', filters],
    queryFn: () => api.get('/templates', { params: filters }).then(res => res.data),
  })
}

export function useTemplate(id) {
  return useQuery({
    queryKey: ['template', id],
    queryFn: () => api.get(`/templates/${id}`).then(res => res.data),
    enabled: !!id,
  })
}
