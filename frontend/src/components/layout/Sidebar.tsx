'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Building2, LogOut, Settings } from 'lucide-react'

const navItems = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    href: '/businesses',
    label: 'Empresas',
    icon: Building2,
  },
  {
    href: '/settings',
    label: 'Configuración',
    icon: Settings,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-60 flex-col bg-[#1e3a5f] text-white">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b border-white/10">
        <span className="text-xl font-bold tracking-tight">
          complif<span className="text-[#3b82f6]">.</span>
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-white/15 text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              )}
            >
              <Icon size={17} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-white/10 px-4 py-4">
        {user && (
          <div className="mb-3">
            <p className="text-sm font-medium text-white truncate">
              {user.firstName
                ? `${user.firstName} ${user.lastName ?? ''}`
                : user.email}
            </p>
            <p className="text-xs text-white/50 truncate">{user.email}</p>
            <span
              className={cn(
                'mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium',
                user.role === 'ADMIN'
                  ? 'bg-[#3b82f6]/30 text-[#93c5fd]'
                  : 'bg-white/10 text-white/60'
              )}
            >
              {user.role}
            </span>
          </div>
        )}
        <button
          onClick={logout}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
        >
          <LogOut size={15} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
