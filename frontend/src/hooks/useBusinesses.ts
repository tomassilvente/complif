import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Business, PaginatedResponse } from '@/types'

interface BusinessFilters {
  search?: string
  status?: string
  country?: string
  page?: number
  limit?: number
}

interface UpdateStatusPayload {
  id: string
  status: string
  comment?: string
}

export function useBusinesses(filters: BusinessFilters = {}) {
  return useQuery<PaginatedResponse<Business>>({
    queryKey: ['businesses', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.search) params.set('search', filters.search)
      if (filters.status) params.set('status', filters.status)
      if (filters.country) params.set('country', filters.country)
      if (filters.page) params.set('page', String(filters.page))
      if (filters.limit) params.set('limit', String(filters.limit))
      const { data } = await api.get(`/api/businesses?${params.toString()}`)
      return data
    },
  })
}

export function useBusiness(id: string) {
  return useQuery<Business>({
    queryKey: ['business', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/businesses/${id}`)
      return data.business ?? data
    },
    enabled: Boolean(id),
  })
}

export function useCreateBusiness() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Partial<Business>) => {
      const { data } = await api.post('/api/businesses', payload)
      return (data.business ?? data) as Business
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businesses'] })
    },
  })
}

export function useDeleteBusiness() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/businesses/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businesses'] })
    },
  })
}

export function useUpdateBusinessStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status, comment }: UpdateStatusPayload) => {
      const { data } = await api.patch(`/api/businesses/${id}/status`, {
        newStatus: status,
        comment,
      })
      return data as Business
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['businesses'] })
      queryClient.invalidateQueries({ queryKey: ['business', variables.id] })
    },
  })
}
