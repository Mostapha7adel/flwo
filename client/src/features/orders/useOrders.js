import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/axios'

export function useOrders() {
  return useQuery({
    queryKey: ['orders'],
    queryFn: () => api.get('/orders').then(res => res.data),
  })
}

export function useOrder(id) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => api.get(`/orders/${id}`).then(res => res.data),
    enabled: !!id,
  })
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }) => api.patch(`/admin/orders/${id}/status`, { status }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
    },
  })
}
