'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { io, Socket } from 'socket.io-client'
import { getToken } from '@/lib/auth'

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/businesses': 'Empresas',
  '/businesses/new': 'Nueva Empresa',
  '/settings': 'Configuración',
}

function getPageTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname]
  if (pathname.match(/^\/businesses\/[^/]+$/)) return 'Detalle de Empresa'
  return 'Complif'
}

interface Notification {
  id: number
  text: string
  timestamp: Date
}

export function Header() {
  const pathname = usePathname()
  const [showNotif, setShowNotif] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)
  const socketRef = useRef<Socket | null>(null)
  const counterRef = useRef(0)

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001'
    const token = getToken()
    const socket = io(wsUrl, { auth: { token }, transports: ['websocket', 'polling'] })
    socketRef.current = socket

    socket.on('business:status_changed', (data: {
      businessName: string
      previousStatus: string
      newStatus: string
    }) => {
      const statusLabel: Record<string, string> = {
        PENDING: 'Pendiente', IN_REVIEW: 'En Revisión',
        APPROVED: 'Aprobada', REJECTED: 'Rechazada',
      }
      counterRef.current += 1
      setNotifications((prev) => [
        {
          id: counterRef.current,
          text: `${data.businessName}: ${statusLabel[data.previousStatus] ?? data.previousStatus} → ${statusLabel[data.newStatus] ?? data.newStatus}`,
          timestamp: new Date(),
        },
        ...prev.slice(0, 9),
      ])
      setUnread((n) => n + 1)
    })

    return () => { socket.disconnect() }
  }, [])

  const handleOpen = () => {
    setShowNotif((v) => !v)
    setUnread(0)
  }

  const title = getPageTitle(pathname)

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
      <div className="relative">
        <button
          onClick={handleOpen}
          className="relative p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-[#1e3a5f] transition-colors"
          aria-label="Notificaciones"
        >
          <Bell size={20} />
          {unread > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
        {showNotif && (
          <div className="absolute right-0 top-full mt-2 w-80 rounded-lg bg-white border border-gray-200 shadow-lg z-50">
            <p className="text-sm font-semibold text-gray-800 px-4 pt-4 pb-2 border-b border-gray-100">
              Notificaciones
            </p>
            <div className="max-h-72 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-sm text-gray-400 px-4 py-4">
                  Las notificaciones en tiempo real aparecerán aquí.
                </p>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className="px-4 py-3 border-b border-gray-50 last:border-0">
                    <p className="text-sm text-gray-700">{n.text}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {n.timestamp.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
