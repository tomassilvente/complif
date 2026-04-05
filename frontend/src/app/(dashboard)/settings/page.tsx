'use client'

import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { User, Mail, Shield } from 'lucide-react'

export default function SettingsPage() {
  const { user } = useAuth()

  if (!user) return null

  return (
    <div className="max-w-lg space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Perfil de Usuario</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-[#1e3a5f] flex items-center justify-center">
              <User size={28} className="text-white" />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900">
                {user.firstName
                  ? `${user.firstName} ${user.lastName ?? ''}`
                  : 'Usuario'}
              </p>
              <p className="text-sm text-gray-500">{user.email}</p>
              <Badge
                variant={user.role === 'ADMIN' ? 'default' : 'gray'}
                className="mt-1"
              >
                {user.role}
              </Badge>
            </div>
          </div>

          <dl className="space-y-4 border-t border-gray-100 pt-4">
            <div className="flex items-start gap-3">
              <Mail size={16} className="text-gray-400 mt-0.5" />
              <div>
                <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  Email
                </dt>
                <dd className="text-sm text-gray-900 mt-0.5">{user.email}</dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Shield size={16} className="text-gray-400 mt-0.5" />
              <div>
                <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  Rol
                </dt>
                <dd className="text-sm text-gray-900 mt-0.5">
                  {user.role === 'ADMIN'
                    ? 'Administrador — puede cambiar estados y gestionar empresas.'
                    : 'Visor — acceso de solo lectura.'}
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <User size={16} className="text-gray-400 mt-0.5" />
              <div>
                <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  ID de Usuario
                </dt>
                <dd className="text-sm font-mono text-gray-500 mt-0.5">
                  {user.id}
                </dd>
              </div>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Acerca de Complif</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 leading-relaxed">
            <strong className="text-[#1e3a5f]">Complif</strong> es una plataforma
            de onboarding KYB (Know Your Business) diseñada para simplificar y
            agilizar la verificación de empresas, gestión de documentación y
            evaluación de riesgo regulatorio.
          </p>
          <p className="text-xs text-gray-400 mt-4">
            Versión 1.0.0 &middot; &copy; {new Date().getFullYear()} Complif
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
