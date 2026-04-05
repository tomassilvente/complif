'use client'

import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
// toast kept for document:uploaded notification below
import { getToken } from '@/lib/auth'

export function useSocket() {
  const queryClient = useQueryClient()
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    const wsUrl =
      process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001'
    const token = getToken()

    const socket = io(wsUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
    })

    socketRef.current = socket

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id)
    })

    socket.on('disconnect', () => {
      console.log('[Socket] Disconnected')
    })

    socket.on('business:status_changed', (data: {
      businessId: string
    }) => {
      queryClient.invalidateQueries({ queryKey: ['businesses'] })
      queryClient.invalidateQueries({
        queryKey: ['business', data.businessId],
      })
    })

    socket.on('document:uploaded', (data: {
      businessId: string
      documentType: string
    }) => {
      toast.success('Documento subido correctamente', {
        description: `Tipo: ${data.documentType}`,
      })
      queryClient.invalidateQueries({
        queryKey: ['business', data.businessId],
      })
    })

    return () => {
      socket.disconnect()
    }
  }, [queryClient])

  return socketRef
}
